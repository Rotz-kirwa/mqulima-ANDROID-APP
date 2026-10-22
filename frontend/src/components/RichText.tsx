import React from "react";
import { StyleProp, Text, TextStyle, View } from "react-native";

// Minimal markdown renderer for AI replies: **bold**, _italic_, "* " / "- " bullets, "1. " lists, ### headings.
function inline(line: string, boldStyle: StyleProp<TextStyle>) {
  const parts = line.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).filter(Boolean);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <Text key={i} style={boldStyle}>{p.slice(2, -2)}</Text>
    ) : p.startsWith("_") && p.endsWith("_") && p.length > 2 ? (
      <Text key={i} style={{ fontStyle: "italic" }}>{p.slice(1, -1)}</Text>
    ) : (
      <Text key={i}>{p}</Text>
    ),
  );
}

export function RichText({ text, style, boldStyle }: { text: string; style: StyleProp<TextStyle>; boldStyle: StyleProp<TextStyle> }) {
  const lines = text.split("\n");
  return (
    <View style={{ gap: 4 }}>
      {lines.map((raw, i) => {
        const line = raw.trimEnd();
        if (!line.trim()) return <View key={i} style={{ height: 4 }} />;
        const bullet = line.match(/^\s*[*-]\s+(.*)$/);
        const num = line.match(/^\s*(\d+)\.\s+(.*)$/);
        const head = line.match(/^#{1,4}\s+(.*)$/);
        if (head) return <Text key={i} style={[style, boldStyle]}>{inline(head[1].replace(/\*\*/g, ""), boldStyle)}</Text>;
        if (bullet || num) {
          return (
            <View key={i} style={{ flexDirection: "row", gap: 6, paddingLeft: 2 }}>
              <Text style={[style, boldStyle]}>{bullet ? "•" : `${num![1]}.`}</Text>
              <Text style={[style, { flex: 1 }]}>{inline(bullet ? bullet[1] : num![2], boldStyle)}</Text>
            </View>
          );
        }
        return <Text key={i} style={style}>{inline(line, boldStyle)}</Text>;
      })}
    </View>
  );
}
