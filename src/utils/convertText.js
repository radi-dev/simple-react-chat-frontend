function escapeHtml(text) {
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&/g, "&amp;");
}

function convertWhatsAppTextToHtml(text) {
  // Escape HTML special characters
  let formattedText = escapeHtml(text);

  // Handle multiline monospace blocks (```block```)
  formattedText = formattedText.replace(
    /```([\s\S]*?)```/g,
    "<pre><code>$1</code></pre>"
  );

  // Handle inline monospace formatting (`code`)
  formattedText = formattedText.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Handle bold formatting (*bold*)
  formattedText = formattedText.replace(/\*(.*?)\*/g, "<b>$1</b>");

  // Handle italic formatting (_italic_)
  formattedText = formattedText.replace(/_(.*?)_/g, "<i>$1</i>");

  // Handle strikethrough formatting (~strikethrough~)
  formattedText = formattedText.replace(/~(.*?)~/g, "<s>$1</s>");

  // Convert URLs to clickable links
  formattedText = formattedText.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Convert line breaks to preserve text formatting
  formattedText = formattedText.replace(/\n/g, "<br>");

  // Handle unordered lists (- or * as bullets)
  formattedText = formattedText.replace(
    /(?:^|\n)[*-] (.*?)(?=\n|$)/g,
    (match, p1) => `<li>${p1}</li>`
  );

  // Wrap unordered list items with <ul>
  formattedText = formattedText.replace(
    /(<li>.*?<\/li>)(?!(<\/ul>|<\/ol>))/gs,
    "<ul>$1</ul>"
  );

  // Handle ordered lists (numbers followed by a period)
  formattedText = formattedText.replace(
    /(?:^|\n)\d+\. (.*?)(?=\n|$)/g,
    (match, p1) => `<li>${p1}</li>`
  );

  // Wrap ordered list items with <ol>
  formattedText = formattedText.replace(
    /(<li>.*?<\/li>)(?!(<\/ol>|<\/ul>))/gs,
    "<ol>$1</ol>"
  );

  return formattedText;
}
