import React from "react";
import { convertWhatsAppTextToHtml } from "../utils/convertText";

function HumanMessage({ text = "", time = "" }) {
  const htmlString = convertWhatsAppTextToHtml(text);

  return (
    <div className="flex items-end justify-end">
      <div className="bg-blue-500 p-3 rounded-lg">
        <div
          className="text-sm text-white"
          dangerouslySetInnerHTML={{ __html: htmlString }}
          style={{ whiteSpace: "pre-wrap" }}
        /><sub className="text-gray-200 text-sm">{time}</sub>
      </div>
      <img
        src="https://pbs.twimg.com/profile_images/1707101905111990272/Z66vixO-_normal.jpg"
        alt="Other User Avatar"
        className="w-8 h-8 rounded-full ml-3"
      />
    </div>
  );
}

export default HumanMessage;
