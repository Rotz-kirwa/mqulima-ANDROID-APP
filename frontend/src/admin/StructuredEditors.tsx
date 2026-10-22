import React, { useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Field } from "@/src/components/Form";
import { AdminButton, useAdminStyles } from "./UI";
import { useTheme } from "@/src/theme";

type Props = { value: any[]; onChange: (value: any[]) => void };

export function VariantsEditor({ value, onChange }: Props) {
  const s = useAdminStyles();
  const update = (index: number, patch: any) => onChange(value.map((item, i) => i === index ? { ...item, ...patch } : item));
  return <View style={s.card}><Text style={s.h2}>Product variants</Text><Text style={s.caption}>Optional sizes or packs. Stock is shared across all variants.</Text>{value.map((variant, i) => <View key={i} style={s.card}><Field testID={`admin-variant-${i}-label`} label="Variant label" value={variant.label} onChangeText={label => update(i, { label })} placeholder="e.g. 50 kg" /><Field testID={`admin-variant-${i}-price`} label="Price (KSh)" value={String(variant.price)} onChangeText={price => update(i, { price })} keyboardType="decimal-pad" /><AdminButton testID={`admin-variant-${i}-remove`} label="Remove variant" secondary onPress={() => onChange(value.filter((_, index) => i !== index))} /></View>)}<AdminButton testID="admin-add-variant" label="Add variant" icon="plus" secondary onPress={() => onChange([...value, { label: "", price: 0 }])} /></View>;
}

export function ServiceStepsEditor({ value, onChange }: Props) {
  const s = useAdminStyles();
  const update = (index: number, patch: any) => onChange(value.map((item, i) => i === index ? { ...item, ...patch } : item));
  return <View style={s.card}><Text style={s.h2}>How the service works</Text>{value.map((step, i) => <View key={i} style={s.card}><Text style={s.eyebrow}>STEP {i + 1}</Text><Field testID={`admin-step-${i}-title`} label="Step title" value={step.title} onChangeText={title => update(i, { title })} /><Field testID={`admin-step-${i}-text`} label="Instructions" value={step.text} onChangeText={text => update(i, { text })} multiline /><AdminButton testID={`admin-step-${i}-remove`} label="Remove step" secondary onPress={() => onChange(value.filter((_, index) => i !== index))} /></View>)}<AdminButton testID="admin-add-step" label="Add service step" icon="plus" secondary onPress={() => onChange([...value, { title: "", text: "" }])} /></View>;
}

function LessonEditor({ lesson, moduleIndex, index, update, remove }: { lesson: any; moduleIndex: number; index: number; update: (patch: any) => void; remove: () => void }) {
  const s = useAdminStyles(); const { colors } = useTheme(); const id = `admin-lesson-${moduleIndex}-${index}`;
  return <View style={s.card}><Text style={s.eyebrow}>LESSON {index + 1}</Text><Field testID={`${id}-title`} label="Lesson title" value={lesson.title} onChangeText={title => update({ title })} /><Field testID={`${id}-duration`} label="Duration" value={lesson.duration} onChangeText={duration => update({ duration })} /><View style={s.row}><Text style={[s.body, s.flex]}>Public sample lesson</Text><Switch testID={`${id}-preview`} value={!!lesson.preview} onValueChange={preview => update({ preview })} trackColor={{ true: colors.brand, false: colors.borderStrong }} /></View><Field testID={`${id}-summary`} label="Sample lesson content" value={lesson.summary || ""} onChangeText={summary => update({ summary })} multiline /><Field testID={`${id}-points`} label="Key takeaways (one per line)" value={(lesson.points || []).join("\n")} onChangeText={text => update({ points: text.split("\n") })} multiline /><AdminButton testID={`${id}-remove`} label="Remove lesson" secondary onPress={remove} /></View>;
}

export function CourseBuilder({ value, onChange }: Props) {
  const s = useAdminStyles(); const { colors } = useTheme(); const [open, setOpen] = useState(0);
  const update = (index: number, patch: any) => onChange(value.map((item, i) => i === index ? { ...item, ...patch } : item));
  return <View style={s.card}><Text style={s.h2}>Course curriculum</Text><Text style={s.caption}>Build modules and text-based sample lessons. Full course delivery remains coming soon.</Text>{value.map((module, i) => <View key={i} style={s.card}><Pressable testID={`admin-module-${i}-expand`} style={s.row} onPress={() => setOpen(open === i ? -1 : i)}><Text style={[s.h3, s.flex]}>{i + 1}. {module.title || "New module"}</Text><View style={s.iconButton}><Lucide name={open === i ? "chevron-up" : "chevron-down"} size={20} color={colors.brand} /></View></Pressable>{open === i && <><Field testID={`admin-module-${i}-title`} label="Module title" value={module.title} onChangeText={title => update(i, { title })} />{module.lessons.map((lesson: any, j: number) => <LessonEditor key={j} lesson={lesson} index={j} moduleIndex={i} update={patch => update(i, { lessons: module.lessons.map((old: any, k: number) => k === j ? { ...old, ...patch } : old) })} remove={() => update(i, { lessons: module.lessons.filter((_: any, k: number) => k !== j) })} />)}<AdminButton testID={`admin-module-${i}-add-lesson`} label="Add lesson" icon="plus" secondary onPress={() => update(i, { lessons: [...module.lessons, { title: "", duration: "5 min", preview: false, summary: "", points: [] }] })} /><AdminButton testID={`admin-module-${i}-remove`} label="Remove module" secondary onPress={() => onChange(value.filter((_, index) => index !== i))} /></>}</View>)}<AdminButton testID="admin-add-module" label="Add module" icon="plus" secondary onPress={() => { setOpen(value.length); onChange([...value, { title: "", lessons: [] }]); }} /></View>;
}