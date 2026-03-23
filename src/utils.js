window.utils = {
  escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "instant"
    });
  },
  updateSliderFill(slider) {
    const min = slider.min || 0;
    const max = slider.max || 100;
    const fill = ((slider.value - min) / (max - min)) * 100;
    slider.style.setProperty('--fill', `${fill}%`);
  }
};