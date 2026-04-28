from __future__ import annotations

import os
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# Study-wide label convention
# 0 = deceptive, 1 = truthful
LABEL_DECEPTIVE = 0
LABEL_TRUTHFUL = 1

# Configure this to reflect the raw checkpoint label mapping.
# For your current checkpoint: raw 0 = truthful, raw 1 = deceptive.
RAW_LABEL_FOR_TRUTHFUL = int(os.getenv("RAW_LABEL_FOR_TRUTHFUL", "0"))
MODEL_VERSION = os.getenv("MODEL_VERSION", "distilbert-v1")
MODEL_DIR = os.getenv("MODEL_DIR", "models/distilBERT_finetuned")
INFERENCE_DEVICE = os.getenv("INFERENCE_DEVICE", "cpu")
ENFORCE_REAL_MODEL = os.getenv("ENFORCE_REAL_MODEL", "0") == "1"


_model = None
_tokenizer = None
_real_inference_enabled = False
_model_load_error: Optional[str] = None


class PredictRequest(BaseModel):
	text: str = Field(..., min_length=1, description="User text to classify")
	participant_id: Optional[str] = None
	statement_index: Optional[str] = None
	request_id: Optional[str] = None
	client_timestamp: Optional[str] = None


class PredictResponse(BaseModel):
	label: int
	labelStr: str
	confidence: float
	model_version: str
	request_id: Optional[str] = None


class ErrorBody(BaseModel):
	code: str
	message: str


class ErrorResponse(BaseModel):
	error: ErrorBody
	request_id: Optional[str] = None


app = FastAPI(title="Deception Classifier API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://model-backend-302671925464.europe-west4.run.app",
        "http://157.90.127.76",
        "https://lpstudies.net",
        "https://www.lpstudies.net",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def normalize_raw_label(raw_label: int) -> int:
	"""
	Normalize raw checkpoint labels to study convention:
	  0 = deceptive, 1 = truthful
	"""
	if raw_label not in (0, 1):
		raise ValueError("raw_label must be 0 or 1")

	if RAW_LABEL_FOR_TRUTHFUL == 0:
		return LABEL_TRUTHFUL if raw_label == 0 else LABEL_DECEPTIVE

	return LABEL_TRUTHFUL if raw_label == 1 else LABEL_DECEPTIVE


def label_to_str(label: int) -> str:
	return "truthful" if label == LABEL_TRUTHFUL else "deceptive"


def placeholder_raw_predict(text: str) -> tuple[int, float]:
	"""
	Temporary deterministic predictor for API scaffolding.
	Replace this with model_raw_predict(...) once model loading is wired.
	Returns (raw_label, confidence_percent).
	"""
	normalized = text.strip().lower()
	if not normalized:
		return 0, 50.0

	score = sum(ord(ch) * (i + 1) for i, ch in enumerate(normalized))
	raw_label = score % 2
	confidence = 55.0 + float(score % 41)
	return raw_label, min(confidence, 99.99)


def load_model_if_available() -> None:
	"""
	Load transformer model/tokenizer if local files are available.
	Keeps the API operational with placeholder inference for development
	unless ENFORCE_REAL_MODEL=1.
	"""
	global _model, _tokenizer, _real_inference_enabled, _model_load_error

	if not os.path.isdir(MODEL_DIR):
		_model_load_error = f"Model directory not found: {MODEL_DIR}"
		if ENFORCE_REAL_MODEL:
			raise RuntimeError(_model_load_error)
		return

	try:
		import torch
		from transformers import AutoModelForSequenceClassification, AutoTokenizer

		tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
		model = AutoModelForSequenceClassification.from_pretrained(
			MODEL_DIR,
			use_safetensors=True,
		)
		model.to(INFERENCE_DEVICE).eval()

		_tokenizer = tokenizer
		_model = model
		_real_inference_enabled = True
		_model_load_error = None
	except Exception as exc:
		_model_load_error = str(exc)
		_real_inference_enabled = False
		if ENFORCE_REAL_MODEL:
			raise RuntimeError(f"Failed to load real model: {exc}") from exc


def model_raw_predict(text: str) -> tuple[int, float]:
	"""
	Run real model inference and return (raw_label, confidence_percent).
	Raw label orientation depends on checkpoint and is normalized later.
	"""
	if not _real_inference_enabled or _model is None or _tokenizer is None:
		raise RuntimeError("Real model is not loaded")

	import torch

	inputs = _tokenizer(
		text,
		return_tensors="pt",
		truncation=True,
		max_length=512,
	).to(INFERENCE_DEVICE)

	with torch.no_grad():
		logits = _model(**inputs).logits

	probs = torch.softmax(logits, dim=-1)[0]
	raw_label = int(probs.argmax().item())
	confidence = float(probs[raw_label].item() * 100)
	return raw_label, round(confidence, 2)


@app.on_event("startup")
def initialize_model() -> None:
	load_model_if_available()


@app.get("/health")
def health() -> dict:
	return {
		"status": "ok",
		"model_version": MODEL_VERSION,
		"raw_label_for_truthful": RAW_LABEL_FOR_TRUTHFUL,
		"real_inference_enabled": _real_inference_enabled,
		"model_dir": MODEL_DIR,
		"device": INFERENCE_DEVICE,
		"model_load_error": _model_load_error,
	}


@app.post(
	"/predict",
	response_model=PredictResponse,
	responses={
		400: {"model": ErrorResponse},
		500: {"model": ErrorResponse},
	},
)
def predict(payload: PredictRequest) -> PredictResponse:
	text = payload.text.strip()

	if not text:
		raise HTTPException(
			status_code=400,
			detail={
				"error": {
					"code": "INVALID_INPUT",
					"message": "Field 'text' must be a non-empty string.",
				},
				"request_id": payload.request_id,
			},
		)

	try:
		if _real_inference_enabled:
			raw_label, confidence = model_raw_predict(text)
		else:
			raw_label, confidence = placeholder_raw_predict(text)
		label = normalize_raw_label(raw_label)
	except Exception as exc:
		raise HTTPException(
			status_code=500,
			detail={
				"error": {
					"code": "INTERNAL_ERROR",
					"message": f"Prediction failed: {exc}",
				},
				"request_id": payload.request_id,
			},
		) from exc

	return PredictResponse(
		label=label,
		labelStr=label_to_str(label),
		confidence=round(float(confidence), 2),
		model_version=MODEL_VERSION,
		request_id=payload.request_id,
	)
