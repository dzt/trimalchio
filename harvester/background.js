var config = {
    mode: "pac_script",
    pacScript: {
        data: "function FindProxyForURL(url, host) {\n" +
        "  if (shExpMatch(url, \'*helper*\'))\n" +
        "    return 'PROXY 127.0.0.1:7492';\n" +
        "  return 'DIRECT';\n" +
        "}"
    }
};
chrome.proxy.settings.set({
  value: config,
  scope: 'regular'
}, function() {

});
