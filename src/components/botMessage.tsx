import React from "react";
import { convertWhatsAppTextToHtml } from "../utils/convertText";

function BotMessage({ text = "", time = "" }) {
  const htmlString = convertWhatsAppTextToHtml(text);

  return (
    <div className="flex items-start">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        width="100"
        height="100"
        fill="#009688"
        className="w-8 h-8 rounded-full"
      >
        {/* <!-- Robot Face --> */}
        <circle cx="50" cy="50" r="20" fill="#009688" />
        <circle cx="50" cy="40" r="2" fill="#fff" />
        <rect x="47" y="45" width="6" height="10" fill="#fff" />
        <circle cx="50" cy="65" r="3" fill="#009688" />

        {/* <!-- Robot Eyes --> */}
        <circle cx="45" cy="45" r="3" fill="#fff" />
        <circle cx="55" cy="45" r="3" fill="#fff" />
        <circle cx="45" cy="45" r="1" fill="#000" />
        <circle cx="55" cy="45" r="1" fill="#000" />

        {/* <!-- Robot Antennas --> */}
        <line
          x1="50"
          y1="30"
          x2="40"
          y2="20"
          stroke="#009688"
          strokeWidth="2"
        />
        <line
          x1="50"
          y1="30"
          x2="60"
          y2="20"
          stroke="#009688"
          strokeWidth="2"
        />
      </svg>
      <div className="ml-3 bg-gray-100 p-3 rounded-lg">
        <div
          className="text-sm text-gray-800"
          dangerouslySetInnerHTML={{ __html: htmlString }}
          style={{ whiteSpace: "pre-wrap" }}
        /><sub className="text-gray-200 text-sm">{time}</sub>
      </div>
    </div>
  );
}

export default BotMessage;
