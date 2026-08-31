export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.publicMessage || "حدث خطأ في الخادم" });
}

export function notFound(req, res) {
  res.status(404).json({ error: "المسار غير موجود" });
}
