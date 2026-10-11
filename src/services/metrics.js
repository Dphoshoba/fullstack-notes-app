// Lightweight metrics collector (Prometheus-compatible exposition format)
let counters = {};

export const recordRequest = (method, path, status) => {
  const key = `${method}|${path}|${status}`;
  counters[key] = (counters[key] || 0) + 1;
};

export const getMetricsText = () => {
  let output = "# HELP http_requests_total Total HTTP requests\n# TYPE http_requests_total counter\n";
  for (const [key, value] of Object.entries(counters)) {
    const [method, path, status] = key.split("|");
    output += `http_requests_total{method="${method}",path="${path}",status="${status}"} ${value}\n`;
  }
  return output;
};
