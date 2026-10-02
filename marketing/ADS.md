# Sparkle Valley · ad kit

Three vertical videos (1080 × 1920, 30 fps, H.264 + AAC) for Instagram Reels, TikTok, YouTube Shorts and Facebook Stories.
Every caption is in English with Vietnamese underneath, so the ads work for both communities and with the sound off.
The music is an original ukulele-and-bells jingle generated for these ads (no samples, no licence issues).

| File | Length | Use it for |
|---|---|---|
| `sparkle-valley-why.mp4` | ~48 s | The story: why a dad made this game. Best as a pinned post or a Facebook-group post. |
| `sparkle-valley-features.mp4` | ~38 s | The key selling points, one per scene. Best for Reels / Shorts and parent groups. |
| `sparkle-valley-teaser.mp4` | ~16 s | Quick hook: Explore! Play! Learn! G'day! Xin chào! Best for Stories and paid ads. |

## Key selling points used

1. **Two homes, one valley:** Vietnam (Bà Rịa, phở, Chùa Một Cột, words from the north, centre and south) and Australia (Sydney streets, milk bar, Big Banana, Aussie slang).
2. **English ⇄ Tiếng Việt in one tap**, with everything spoken aloud.
3. **40+ games:** folk games (Ô ăn quan, Đập niêu, kite flying, backyard cricket, Mr Wolf, dragon snake), plus thinking games (counting, letters, puzzles, memory, money).
4. **Learn money in AUD and VND.**
5. **Little ones never lose:** in under-5 mode everything is spoken and every game ends in a celebration.
6. **Family voice:** record Mum and Dad saying the praise lines.
7. **Private, works offline, no ads, no accounts.**
8. **Made by a dad (Henry Nguyen)** for his children, growing up between two homes.

## Post captions (copy and paste)

**English**
> My kids are growing up between two homes: Vietnam 🇻🇳 and Australia 🇦🇺. So I built them Sparkle Valley, a gentle 3D world where they hear both languages, play the folk games their grandparents played, and learn to count, read and solve problems. Ages 2–8 · No ads · Works offline. Open it in your browser and tap "Add to Home Screen". 💛

**Tiếng Việt**
> Các con tôi lớn lên giữa hai quê hương: Việt Nam 🇻🇳 và Úc 🇦🇺. Vì vậy tôi làm Thung Lũng Lấp Lánh, một thế giới 3D nhẹ nhàng nơi các con được nghe cả hai thứ tiếng, chơi trò chơi dân gian của ông bà, và học đếm, đọc, giải đố. Cho bé 2–8 tuổi · Không quảng cáo · Chơi được khi không có mạng. Mở trên trình duyệt rồi bấm "Thêm vào màn hình chính". 💛

**Hashtags:** #SparkleValley #ThungLungLapLanh #VietnameseAustralian #NguoiVietOUc #BilingualKids #SongNgu #LearnVietnamese #HocTiengViet #KidsGames #TroChoiDanGian #EducationalGames #Preschool

## Voice-over script (record it in your own voice)

Your own voice will feel much warmer than a computer voice. Record each line on your phone in a quiet room, then drop the audio over the video in CapCut, InShot or iMovie (lower the music to about 30% under your voice).

**"Why" video (~48 s)**

| Time | English | Tiếng Việt |
|---|---|---|
| 0:00 | My kids are growing up between two homes. | Các con tôi đang lớn lên giữa hai quê hương. |
| 0:05 | Bà Rịa… and Sydney. | Bà Rịa… và Sydney. |
| 0:09 | So I built them one magical valley, | Nên tôi làm cho các con một thung lũng diệu kỳ, |
| 0:13 | with milk bars, Big Things and Aussie slang, | có tiệm tạp hóa Úc, những "Big Things" và tiếng lóng Úc, |
| 0:18 | and phở, Chùa Một Cột and words from all three regions. | và có phở, Chùa Một Cột, và tiếng của cả ba miền. |
| 0:22 | They play the folk games their grandparents played, | Các con chơi những trò chơi dân gian của ông bà, |
| 0:27 | and learn to count, read and solve problems. | và học đếm, học đọc, học giải đố. |
| 0:32 | Every mistake is just a chance to try again. | Sai thì mình thử lại thôi. |
| 0:37 | I'm Henry, and I made this with love, for my kids and yours. | Tôi là Henry, tôi làm trò chơi này bằng cả tấm lòng, cho con tôi và con của bạn. |
| 0:42 | Sparkle Valley. Two homes, one valley. | Thung Lũng Lấp Lánh. Hai quê hương, một thung lũng. |

**"Features" video (~38 s)**: read each caption as it appears, in one language or both.

## Re-rendering or changing the ads

The ads are made from real screenshots of the game, animated in a small HTML "stage" and rendered frame by frame.
The source (stage, scene lists, music synth, render script) is in `marketing/source/`. Change a caption or scene order in `videos.js`, then run:

```bash
cd marketing/source
python3 -m http.server 8770 &        # serves the stage
./make.sh why features teaser        # renders frames, makes music, writes out-*.mp4 (needs node + playwright + ffmpeg)
```
