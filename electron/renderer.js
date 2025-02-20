function showView(viewId) {
  document.querySelectorAll('.view').forEach(view => {
      view.style.display = 'none';
  });

  document.getElementById(viewId).style.display = 'block';
}
