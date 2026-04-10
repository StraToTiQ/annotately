chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'PROXY_REQUEST') {
    const { url, method, headers, data } = message.config;

    fetch(url, {
      method: method.toUpperCase(),
      headers: headers,
      body: data ? (typeof data === 'string' ? data : JSON.stringify(data)) : undefined
    })
      .then(async (res) => {
        const text = await res.text();
        let jsonData;
        try {
          jsonData = JSON.parse(text);
        } catch {
          jsonData = text;
        }

        sendResponse({
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries()),
          data: jsonData
        });
      })
      .catch((err) => {
        sendResponse({ error: err.message || "Network Error" });
      });

    return true; // Indicates we will send a response asynchronously
  }
});
