# Home carousel round 2 — index

Deliverable root: `/workspace/site-assets-1.15/round2/`. Each made slide has `<tab>-NN-{en,he}.png` and `.jpg` at 630×1120. Old approved `sound-01` / `sound-02` (scales / frequencies, FIG. 01 / FIG. 02 headers) are in `old/`.

Source of old ids and captions: `L-studio-site` @ `265b07d` (parent of `a65c08c`), `client/src/lib/carousel.ts` + `content.json`. Code refs are in `/workspace/main-wt` (1.15).

Capture roots:

- `CAP` = `/workspace/site-assets-1.15/captures-1.15/`
- `GUIDE` = `/workspace/site-116/assets/guide/`
- `UREF` = `/workspace/plan-1.15/user-ref/`

---

## Sound

### sound-01 — replaces `sound-fx` — FIG. 01 / איור 01

| | |
|---|---|
| Files | `sound-01-en.png/.jpg`, `sound-01-he.png/.jpg` |
| EN headline | Twelve worlds. / Turn a world on. |
| HE headline | שנים עשר עולמות / הפעילו עולם |
| Capture | `CAP/03-sound-fx-page1-subforge-tone.png` |
| Code | `SoundFx.kt` `COUNT = 12`; `SoundFxDialog.kt` `PER_PAGE = 4` (3 pages), slots `sound_fx_1`…`sound_fx_12` (Sub Forge … FM); long-press opens Tone; RATE / SYNC / Transpose. Worlds 9–12 added in 1.13 (`SoundFxNewWorlds.kt`). |
| Flags | Old caption: “12 effects, 4 of them new.” Dropped “new”. Shot is Sub Forge on page 1, not a later page. |

### sound-02 — replaces `sound-fx-knobs` — FIG. 02 / איור 02

| | |
|---|---|
| Files | `sound-02-en.png/.jpg`, `sound-02-he.png/.jpg` |
| EN headline | Effect knobs. / Long press a world. |
| HE headline | כפתורי האפקט / לחצו ארוכות על עולם |
| Capture | Same file as sound-01, cropped to the Tone knobs / SYNC / Transpose band. |
| Code | `SoundFxDialog.kt` long-press opens Tone; knobs RATE, AMOUNT, LOW, MID, HIGH, SWEEP (Mid-sweep in `FxTone`), REVERB; SYNC. |
| Flags | Old caption named Iron Growl and said both keyboards stay open. This capture is Sub Forge with one keyboard visible. Same source frame as sound-01 (intentional; no Iron Growl Tone shot). |

### sound-03 — replaces `sound-fm` — FIG. 03 / איור 03

| | |
|---|---|
| Files | `sound-03-en.png/.jpg`, `sound-03-he.png/.jpg` |
| EN headline | Real FM. / Four operators. |
| HE headline | FM אמיתי / ארבעה אופרטורים |
| Capture | `CAP/18-sound-fm.png` (Sound window, FM page, 4-operator, ALGO A3) |
| Code | `SoundFxFm.kt`: 4 sine operators, `FmAlgo.COUNT = 8`, default algo 3 (“Branch”). `SoundFxFmUi.kt` + `strings.xml`: ALGO, RATIO, INDEX, FEEDBK, DECAY, MIX. World 12 in `SoundFxDialog.kt`. |
| Flags | Old caption’s knob meanings (pitch, brightness, edge, fade, amount) match the 1.15 roles and were kept. Shot shows A3, not a generic diagram of all 8 algos. |

### sound-04 — replaces `sound-scales` — FIG. 04 / איור 04

| | |
|---|---|
| Files | `sound-04-en.png/.jpg`, `sound-04-he.png/.jpg` |
| EN headline | Pick a scale. / Tap a green scale. |
| HE headline | בחרו סולם, / הקישו על סולם ירוק |
| Capture | `CAP/01-key-scales-cmaj-greens.png` |
| Code | Key / scale picker: Major or Minor from 12 roots, or SCALE OFF; dots on scale notes; frequencies unchanged. |
| Notes | Renumbered approved slide. Header only: `FIG. 04` / `איור 04`. Copy, crops and design unchanged. Previous FIG. 01 files are in `old/`. |

### sound-05 — replaces `sound-frequencies` — FIG. 05 / איור 05

| | |
|---|---|
| Files | `sound-05-en.png/.jpg`, `sound-05-he.png/.jpg` |
| EN headline | Type your own Hz. / Pick a ready scale. |
| HE headline | הקלידו הרץ משלכם, / או בחרו סולם מוכן |
| Capture | `CAP/02-custom-frequency-hijaz.png` |
| Code | Per-key Hz, ready scales such as Hijaz or Kurd, up to 8 user presets. |
| Notes | Renumbered approved slide. Header only: `FIG. 05` / `איור 05`. Copy, crops and design unchanged. Previous FIG. 02 files are in `old/`. |

### sound-06 — replaces `sound-wave-panel` — FIG. 06 / איור 06

| | |
|---|---|
| Files | `sound-06-en.png/.jpg`, `sound-06-he.png/.jpg` |
| EN headline | Wave panel. / Hold a wave key. |
| HE headline | לוח הגל / לחצו ארוכות על גל |
| Capture | `GUIDE/wave-panel-phone.jpg` (guide phone crop, not `captures-1.15`; 720×1472). Labels checked against 1.15. |
| Code | Hold a wave key: octave, EQ and four pages; changes are heard at once and saved. |
| Flags | Guide source. FIG B caption “SQUARE 1 EQ” also shows RIP / FUZZ / PHAZ / PIANO and keys in the same crop (not clipped; crop is wider than the EQ row alone). |

### sound-07 — replaces `sound-two-keyboards` — FIG. 07 / איור 07

| | |
|---|---|
| Files | `sound-07-en.png/.jpg`, `sound-07-he.png/.jpg` |
| EN headline | Two keyboards. / Tap the plus. |
| HE headline | שתי מקלדות / הקישו על הפלוס |
| Capture | `GUIDE/octave-badges-dual-phone.jpg` (guide phone crop, not `captures-1.15`). |
| Code | `tour_pad_dual_body`: second keyboard stays open on Sound and Pad. Tap + beside VOICES; one octave up. |
| Flags | Guide source. |

---

## Mic

### mic-01 — replaces `mic-channels` — FIG. 01 / איור 01

| | |
|---|---|
| Files | `mic-01-en.png/.jpg`, `mic-01-he.png/.jpg` |
| EN headline | Mic recording. / Two input pages. |
| HE headline | הקלטת Mic / שני עמודי ערוצים |
| Capture | FIG A/B: `CAP/22-mic-page1.png`. FIG C: `CAP/22b-mic-page2.png`. Previous 1.16-debug-APK files are in `old/`. |
| Code | Defaults in `SynthAppUI.kt:567` and `SessionSupport.kt`: Vocal 1, Vocal 2, Vocal 3, Guitar, Bass, Inst 3. Monitor and Redo (`action_redo`) sit on the Mic top row. |
| Flags | Page 2’s third channel is **Inst 3** on screen and in code; the old caption and leftover `mic_page2_hint` say Instrumental. Do not repeat `mic_page1_hint` “no length limit”. |

### mic-02 — replaces `mic-editor` — FIG. 02 / איור 02

| | |
|---|---|
| Files | `mic-02-en.png/.jpg`, `mic-02-he.png/.jpg` |
| EN headline | Mic editor. / Trim a take. |
| HE headline | עורך Mic / חיתוך ולולאה |
| Capture | `CAP/08-mic-editor-recorded-take.png` |
| Code | Trim, loop, eight rhythm boxes (long-press for repeats), EQ, Gain, Squeeze. |

### mic-03 — replaces `mic-lyrics` — FIG. 03 / איור 03

| | |
|---|---|
| Files | `mic-03-en.png/.jpg`, `mic-03-he.png/.jpg` |
| EN headline | Lyrics. / Scroll your words. |
| HE headline | מילים / גללו את המילים |
| Capture | `CAP/09-mic-lyrics-pane.png` |
| Code | Lyrics teleprompter: type or paste, Play to scroll, speed and text size (`lyrics_play`, `lyrics_speed`, A- / A+). |
| Flags | FIG B is a real empty lyrics pane (no pasted words in the capture). Controls (Play, speed, size) are in FIG C. |

### mic-04 — replaces `mic-mastering` — FIG. 04 / איור 04

| | |
|---|---|
| Files | `mic-04-en.png/.jpg`, `mic-04-he.png/.jpg` |
| EN headline | Mastering. / Style, then export. |
| HE headline | מאסטרינג / סגנון, ואז ייצוא |
| Capture | `CAP/12-mastering-beginner-styles.png` (FIG A/B); FIG C from `CAP/14-mastering-export.png`. |
| Code | `mastering_postrec_master` “Master this take”; eight styles in `strings_mastering.xml`; A Before / B Style; `MasteringFormats.kt` WAV / MP3 / FLAC. Files stay on the phone. |

---

## Loop

### loop-01 — replaces `loop-looper` — FIG. 01 / איור 01

| | |
|---|---|
| Files | `loop-01-en.png/.jpg`, `loop-01-he.png/.jpg` |
| EN headline | Looper. / Eight pages. |
| HE headline | Looper / שמונה עמודים |
| Capture | `CAP/19-loop-looper.png` (main Looper, live Play 1.15). |
| Code | `LooperCapacity.kt`: `PAGES = 8`, `CHANNELS_PER_PAGE = 4`, `TRACKS = 32`. Redo is `action_redo` (same Redo key as Drum). Record and play sit on each channel. |
| Flags | Inspected before render: no colored page chips or page-name colors. Pages are numbered 1–8 plus a “Page 1” text label. All four channels in the shot are empty; record / play / redo controls are visible. |

### loop-02 — replaces `loop-fx` — FIG. 02 / איור 02

| | |
|---|---|
| Files | `loop-02-en.png/.jpg`, `loop-02-he.png/.jpg` |
| EN headline | Looper FX. / Eight FX presets. |
| HE headline | אפקטי Looper / שמונה פריסטים |
| Capture | `CAP/04-looper-fx-hookglue-tone.png` |
| Code | Eight Looper FX presets (`fx_loop_1` Hook Glue … `fx_loop_3` Indie Wash and the rest); tap to toggle; long-press for Tone knobs and Transpose. |
| Flags | Old caption used Indie Wash as the example. Shot shows Hook Glue selected; Indie Wash is visible in the grid. |

### loop-03 — replaces `loop-editor` — FIG. 03 / איור 03

| | |
|---|---|
| Files | `loop-03-en.png/.jpg`, `loop-03-he.png/.jpg` |
| EN headline | Loop editor. / Trim, loop, EQ. |
| HE headline | עורך לולאות / חיתוך ולולאה |
| Capture | `CAP/20-loop-editor.png` (Loop Editor, recorded loop + waveform). |
| Code | `LoopEditorDialog.kt`: TRIM and LOOP bars; `loop_rhythms_hint` “Rhythms (long-press for repeats)”; eight boxes (`LoopEditorSettings.RHYTHMS`); EQ (LOW, MID, HIGH, MID HZ); `loop_free` when no box is on. Tour body (`tour_loop_editor_body`) matches trim, loop, rhythm repeats, EQ. |

### loop-page-name — dropped

Feature removed in 1.15. Old designed file was `loop-4`. Not numbered and not remade. `loop-mixer` is now Loop FIG. 04.

### loop-04 — replaces `loop-mixer` — FIG. 04 / איור 04

| | |
|---|---|
| Files | `loop-04-en.png/.jpg`, `loop-04-he.png/.jpg` |
| EN headline | Analog mixer. / Drive, EQ, a fader. |
| HE headline | מיקסר אנלוגי / ערוצים ומאסטר |
| Capture | `CAP/10-mixer-spectrum.png` (FIG A/B); FIG C from `CAP/11-mixer-mix-map-clash.png`. |
| Code | `MixerController.kt` `SLOTS = 8`; stems Drums, Looper, Mic + Master (Drive, HPF, EQ, Comp, Pan, fader); eight mixer presets. `header_live_scope` / `mixer_hint_open`: LIVE SCOPE opens Analog Mixer from other windows. Mixer chrome is SPECTRUM / MIX MAP. |
| Flags | Old caption: “Tap LIVE SCOPE on top.” Corrected: LIVE SCOPE is the entry; SPECTRUM and MIX MAP are the mixer views. |

---

## Pad

### pad-01 — replaces `pad-live` — FIG. 01 / איור 01

| | |
|---|---|
| Files | `pad-01-en.png/.jpg`, `pad-01-he.png/.jpg` |
| EN headline | Live pad. / The sound follows. |
| HE headline | משטח נגינה חי / גוררים והצליל עוקב |
| Capture | FIG A: `UREF/david-redmi14-pad-ref-1.png`; FIG B/C: `UREF/david-redmi14-pad-ref-2.png` (1.15 user-ref phones). |
| Code | Drag on the pad and the sound follows. Targets KEY, MIC, LOOP or DRUM. Hold 1/4, 1/8, 1/16 or 1/32 for a repeat; STOP cuts it. LIVE is not called “new”. |
| Flags | User-ref source, not `captures-1.15`. |

---

## Drum

### drum-01 — replaces `drum-rows` — FIG. 01 / איור 01

| | |
|---|---|
| Files | `drum-01-en.png/.jpg`, `drum-01-he.png/.jpg` |
| EN headline | All eight rows. / Tap plus or minus. |
| HE headline | כל שמונה השורות / פלוס ומינוס |
| Capture | `CAP/21-drum-rows-8.png` (Drum tab, all 8 rows, control reads −). |
| Code | `DualKeyboard.kt`: `DUAL_KEY_OPEN = "+"`, `DUAL_KEY_CLOSE = "−"` (U+2212), no number. `SynthAppUI.kt` `drumExtrasOpen`: expands to the 8-channel layout and hides the keyboard (`keyboardHidden` when extras open); `visibleDrumTracks` is 8; comment at `SynthAppUI.kt:5871`. Row names in `DrumEngine.kt` `trackNames`: Kick, Snare, Hi-Hat, Perc, Bass, FX 1, FX 2, Voice. |
| Flags | Old caption said +4 / -4 and “FX 3”. 1.15 is + / −, and the eighth row is Voice, not FX 3. Copy written to match the code and the capture. |

### drum-02 — replaces `drum-fx` — FIG. 02 / איור 02

| | |
|---|---|
| Files | `drum-02-en.png/.jpg`, `drum-02-he.png/.jpg` |
| EN headline | Drum FX. / Eight drum presets. |
| HE headline | אפקטי Drum / שמונה פריסטים |
| Capture | `CAP/06-drum-fx-streetboom-tone.png` |
| Code | Eight Drum FX presets (`fx_drum_1` Street Boom … `fx_drum_6` Tribal Bloom and the rest); tap to toggle; long-press for AMOUNT, LOW, MID, HIGH, SWEEP, REVERB and Transpose. |
| Flags | Old caption used Tribal Bloom as the example. Shot shows Street Boom selected. SWEEP is Mid-sweep. |

### drum-03 — replaces `drum-banks` — FIG. 03 / איור 03

| | |
|---|---|
| Files | `drum-03-en.png/.jpg`, `drum-03-he.png/.jpg` |
| EN headline | Sample banks. / One picker per row. |
| HE headline | בנקי דגימות / בורר לכל שורת תופים |
| Capture | `GUIDE/drum-samples-phone.jpg` (guide phone crop, not `captures-1.15`). Kick picker, Factory / Exclusive, War Horn / Victory Peak on screen. |
| Code | Eight drum rows, each with its own picker; Factory and Exclusive banks. |
| Flags | Guide source. FIG C is a tight Factory / Exclusive crop of the same picker. |

### drum-04 — replaces `drum-loaded` — FIG. 04 / איור 04

| | |
|---|---|
| Files | `drum-04-en.png/.jpg`, `drum-04-he.png/.jpg` |
| EN headline | Your own samples. / Trim, save, rename. |
| HE headline | הדגימות שלכם / חותכים ושומרים |
| Capture | `GUIDE/drum-loaded-trim-phone.jpg` (guide phone crop, not `captures-1.15`). |
| Code | `DrumLoadedBank.kt` `MAX = 88`; trim with start and end bars; SAVE, RESET, RENAME, DELETE; saved automatically. Factory, Exclusive and Authentic sit next to LOADED on the row (visible in 1.15; old caption named only LOADED). |
| Flags | Guide source. Authentic is on the 1.15 UI and is named in the cells; it was not in the old caption. |

---

## Missing captures

None. All 20 numbered slots are made. Dropped, not missing: `loop-page-name`.

## Lint

Every made HE slide passed, at render time, 0 issues:

- `fig_template_site.py` bidi lint (`_BAD`: no punctuation after a number, `%`, or Latin run at end of string or before Hebrew)
- `he_lint.py` `assert_he`: no maqaf (U+05BE); no Hebrew letter glued to Latin or digits; no detached prefix (`ב ו ל כ ש ה מ` + space + Latin/digit, e.g. not `ב Loop`); no reordered pattern (Latin + space + lone `ו/ב/ל` + Hebrew, e.g. not `Redo ו עמודים`)
- Latin runs are wrapped in LRI…PDI (`U+2066`…`U+2069`) at measure/draw time, including trailing `A-` / `A+`
- no maqaf used as a fix; prefixes were rewritten with a full Hebrew noun (`בחלון`, `לכפתורי`, `וגם`, `למינוס`, …)

EN and HE headlines, sublines, cells and TRY lines also passed template asserts (headline budget 920, `min_scale` 0.85, `max_lines` 3, column gap, TRY width, cell titles).

## Visual self-check (spot)

Headers on the renumbered pair are `FIG. 04` / `איור 04` and `FIG. 05` / `איור 05` with locked copy. New fills: sound-03 (FM / A3 knobs), loop-01 (8 page keys, no color chips), loop-03 (waveform + trim/loop + rhythms), drum-01 (all 8 rows + gold −), mic-01 (page 1 vocals + page 2 Guitar / Bass / Inst 3). All 20 HE slides were read at full size (header, headline, subline, FIG A/B/C captions, 4 cells, TRY, footer). Loop-01 TRY and FIG C and the other rewritten mixed lines read correctly right to left. `contact-he.jpg` was rebuilt after this pass. `contact-en.jpg` was not rebuilt (EN files unchanged).

Remaining notes, not blockers: mic-03 FIG B is a real empty lyrics pane; sound-06 FIG B includes more wave-page chrome than the “SQUARE 1 EQ” caption alone; drum-03 FIG C is a tight banks crop; sound-01 and sound-02 share one capture, cropped differently; loop-01 channels in the shot are empty; loop-03 has a slightly larger vertical gap (57, just under the 58 cap).
