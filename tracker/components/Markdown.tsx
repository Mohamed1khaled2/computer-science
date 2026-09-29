// markdown بسيط لردود المشرف: فقرات، قوايم، **bold**، `code`، و ```code blocks```.
// بيبني React elements مباشرةً (من غير innerHTML) فمفيش خطر XSS.

import { Fragment, type ReactNode } from "react";

function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <b key={i}>{part.slice(2, -2)}</b>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export default function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) code.push(lines[i++]);
      i++;
      blocks.push(
        <pre key={blocks.length}>
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }
    const bullet = /^\s*[-*•]\s+/;
    const numbered = /^\s*\d+[.)]\s+/;
    if (bullet.test(line) || numbered.test(line)) {
      const re = bullet.test(line) ? bullet : numbered;
      const items: string[] = [];
      while (i < lines.length && re.test(lines[i])) items.push(lines[i++].replace(re, ""));
      const List = re === bullet ? "ul" : "ol";
      blocks.push(
        <List key={blocks.length}>
          {items.map((it, j) => (
            <li key={j}>{inline(it)}</li>
          ))}
        </List>,
      );
      continue;
    }
    if (line.trim()) {
      const heading = line.replace(/^#+\s*/, "");
      blocks.push(<p key={blocks.length}>{heading !== line ? <b>{inline(heading)}</b> : inline(line)}</p>);
    }
    i++;
  }
  return <div className="prose-chat">{blocks}</div>;
}
