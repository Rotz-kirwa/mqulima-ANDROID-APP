import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Page, useStackBottom } from "@/src/components/Page";
import { Body } from "@/src/components/ui";
import { legal } from "@/src/data/pages";
import { fonts, makeStyles } from "@/src/theme";

export default function Legal() {
  const s = useStyles();
  const bottom = useStackBottom();
  return (
    <Page title="Terms & Privacy" testID="legal-screen">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: bottom }}>
        {legal.map((sec) => (
          <View key={sec.title} style={s.card} testID={`legal-${sec.title.split(" ")[0].toLowerCase()}`}>
            <Text style={s.title}>{sec.title}</Text>
            {sec.body.map((p, i) => <Body key={i} style={{ fontSize: 13 }}>{`${i + 1}. ${p}`}</Body>)}
          </View>
        ))}
        <Text style={s.meta}>Last updated: September 2026 • Questions? mqulima@mqulima.com</Text>
      </ScrollView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  card: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 24, padding: 20, gap: 10 },
  title: { fontFamily: fonts.h900, fontSize: 20, color: c.onSurface },
  meta: { fontFamily: fonts.b500, fontSize: 12, color: c.muted, textAlign: "center" },
}));
