# 🖨️ Fly Media Biometric & RFID Terminal — 3D Printing & Assembly Guide

This guide contains everything you need to 3D print and assemble the commercial wall-mount enclosure for the **ESP32 + 2.8" Touch TFT + RC522 RFID + R307 Fingerprint** access control system.

---

## 📁 3D CAD Files & Resources

| File Name | Description | Path |
| :--- | :--- | :--- |
| **`enclosure_3d_viewer.html`** | 🌐 Interactive 3D WebGL Viewer (Orbit, Zoom, Explode Slider, Color Themes, STL Export) | [enclosure_3d_viewer.html](file:///d:/Tanmay/Desktop%20Support/3d_model/enclosure_3d_viewer.html) |
| **`terminal_front_shell.stl`** | 🖨️ Front Bezel Shell (Print Face-Down) | [terminal_front_shell.stl](file:///d:/Tanmay/Desktop%20Support/3d_model/terminal_front_shell.stl) |
| **`terminal_rear_baseplate.stl`** | 🖨️ Rear Wall-Mount Baseplate (Print Back-Down) | [terminal_rear_baseplate.stl](file:///d:/Tanmay/Desktop%20Support/3d_model/terminal_rear_baseplate.stl) |
| **`biometric_terminal_enclosure.scad`** | 📐 Fully Parametric OpenSCAD Source Code (Customizable in FreeCAD/OpenSCAD) | [biometric_terminal_enclosure.scad](file:///d:/Tanmay/Desktop%20Support/3d_model/biometric_terminal_enclosure.scad) |
| **`enclosure_3d_render.png`** | 🖼️ Assembled 3D Studio Rendering | [enclosure_3d_render.png](file:///d:/Tanmay/Desktop%20Support/3d_model/enclosure_3d_render.png) |
| **`enclosure_3d_exploded.png`** | 🖼️ Exploded View 3D Rendering (Showing internal layer stacking) | [enclosure_3d_exploded.png](file:///d:/Tanmay/Desktop%20Support/3d_model/enclosure_3d_exploded.png) |

---

## ⚙️ Slicer Print Recommendations (Bambu Studio / PrusaSlicer / Cura)

| Parameter | Recommended Setting | Reason |
| :--- | :--- | :--- |
| **Material** | **PETG** or **PLA+** (Matte Black or Dark Slate Grey) | PETG has high impact resistance and UV durability for office doors. |
| **Layer Height** | **0.20 mm** (Standard) | Clean surface finish on bezels and fast print time (~3h total). |
| **Perimeters / Wall Loops** | **4 Walls** (1.6 mm solid perimeter) | Ensures screw bosses and corners are solid and rigid. |
| **Top / Bottom Solid Layers** | **5 Top, 4 Bottom** | Completely hides infill patterns on faceplates. |
| **Infill Density & Pattern** | **25% Gyroid** or **Adaptive Cubic** | Maximum torsional stiffness with minimum material weight. |
| **Print Orientation** | **Front Shell**: Place outer face flat down on the build plate.<br/>**Rear Baseplate**: Place flat back down on the build plate. | Eliminates the need for external supports. |
| **Supports** | **Tree Supports (Touching buildplate only)** | Only needed for the 4 internal screw boss overhangs. |
| **Print Bed Adhesion** | Textured PEI sheet (Cleaned with Isopropyl Alcohol) | Gives the front faceplate an industrial matte textured finish. |

---

## 🔩 Hardware Bill of Materials (BOM)

To assemble the enclosure, you will need:

1. **4× M3 Heat-Set Threaded Brass Inserts** (`M3 × 4mm` or `M3 × 5mm`, OD `4.2mm`):
   - Pressed into the 4 corner bosses on the front shell with a soldering iron tip at 220°C.
2. **4× M3 × 16mm or 20mm Socket Head Screws**:
   - Fastens the rear baseplate to the front shell through the counterbored holes.
3. **4× M2.5 × 6mm Self-Tapping Screws**:
   - Secures the ESP32 DevKit to the rear baseplate standoffs.
4. **4× M2.5 × 6mm Nylon Screws or Double-Sided Foam Tape**:
   - Secures the 2.8" SPI TFT LCD module into its internal bezel pocket.
5. **2× Wall Anchors & M4 Pan-Head Screws**:
   - For mounting the rear baseplate onto the wall using the dual keyhole slots.

---

## 🛠️ Step-by-Step Assembly Instructions

```
             ┌───────────────────────────────────────────────┐
             │            1. FRONT SHELL (BEZEL)             │
             │  - 2.8" TFT Screen glued/screwed into pocket  │
             │  - RC522 snapped behind center RFID zone      │
             │  - R307 sensor seated into ergonomic well     │
             │  - 5mm RGB LED pressed into light-pipe hole   │
             │  - Buzzer glued behind sound grill            │
             └───────────────────────┬───────────────────────┘
                                     │
                             (WIRING HARNESS)
                                     │
             ┌───────────────────────▼───────────────────────┐
             │             2. REAR BASEPLATE                 │
             │  - ESP32 screwed into 4 standoffs             │
             │  - Cable routed through rear/bottom relief    │
             │  - 4x M3 screws fasten through back into      │
             │    front shell brass inserts                  │
             └───────────────────────────────────────────────┘
```

1. **Install Heat-Set Inserts**:
   - Heat your soldering iron to ~210°C–230°C.
   - Gently press an M3 brass threaded insert into each of the 4 corner bosses on the front shell until flush.
2. **Mount the 2.8" TFT Display**:
   - Seat the display face-down into the upper window pocket. The 46×61mm cutout aligns directly with the active pixels.
   - Fasten with M2.5 nylon screws or a dab of hot glue/VHB tape on the corners.
3. **Install R307 Fingerprint Sensor**:
   - Push the optical prism head into the bottom angled well until the blue lens is flush with the front chamfer.
4. **Install RC522 RFID Reader**:
   - Snap or slide the RC522 module into the center internal clips directly behind the embossed card icon. Because plastic is RF-transparent, it reads RFID cards and keyfobs up to 3–5 cm through the front wall!
5. **Install Status LED & Buzzer**:
   - Push the 5mm RGB LED into the 5.2mm hole (use a drop of clear silicone or hot glue to form a diffuse light pipe).
   - Fasten the active buzzer behind the 5-hole sound matrix.
6. **Connect the Wiring Harness**:
   - Connect the shared SPI bus (MOSI GPIO 23, MISO GPIO 19, SCK GPIO 18) and power rails as shown in `esp32/tft_rfid_wiring_diagram.png`.
7. **Mount to Wall (Next to Office Glass Door)**:
   - Install 2 wall anchors and screws spaced 90mm apart vertically.
   - Hang the rear baseplate onto the wall screws via the keyholes.
   - Route the 12V power adapter wire and the 2-wire relay cable (going to the frameless glass U-bracket maglock) through the bottom cable notch.
   - Fasten the front shell to the rear baseplate using the 4× M3 screws.

---

## 🌐 Opening the Interactive 3D Viewer

You can open the 3D model in your browser to inspect it in full 360° 3D:
- Double-click or open [enclosure_3d_viewer.html](file:///d:/Tanmay/Desktop%20Support/3d_model/enclosure_3d_viewer.html) in Chrome or Edge.
- Use your mouse to rotate, pan, and zoom.
- Drag the **Explode Distance** slider to separate the layers and view the internal component layout!
- Click **"📥 Front Shell STL"** or **"📥 Rear Base STL"** to export sliced STLs directly!
