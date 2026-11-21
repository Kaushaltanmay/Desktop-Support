# 🖨️ Fly Media Biometric & RFID Terminal — 3D Printing & CAD Dimensions Guide

This guide contains the complete technical blueprint, dimensions in centimeters (**cm**), and 3D printing instructions for the commercial wall-mount enclosure.

---

## 📐 Master Dimensional Specifications (in Centimeters — cm)

| Component / Feature | Measurement in Centimeters (**cm**) | Details & Notes |
| :--- | :--- | :--- |
| **Enclosure Width** | **11.5 cm** | Exterior width across front bezel |
| **Enclosure Height** | **18.5 cm** | Exterior vertical height |
| **Total Enclosure Depth** | **3.4 cm** | Front Shell **1.8 cm** + Rear Baseplate **1.6 cm** |
| **Wall Thickness** | **0.24 cm** (2.4 mm) | 4 solid perimeter loops for structural rigidity |
| **Corner Fillet Radius** | **0.9 cm** (9.0 mm) | Modern ergonomic curved corners |
| **2.8" SPI TFT Cutout** | **4.8 cm (W) × 6.5 cm (H)** | Full active display window with internal retaining pocket |
| **RC522 RFID Card Pocket** | **4.2 cm (W) × 5.8 cm (H)** | Center tap pocket (detection range 3.0 cm – 5.0 cm) |
| **R307 Fingerprint Cutout** | **2.4 cm (W) × 2.0 cm (H)** | Bottom thumb rest with **15° ergonomic lead-in bevel** |
| **RGB Status LED Bezel** | **Ø 0.65 cm** (6.5 mm) | Elevated collar for 5mm diffuse LED / light pipe |
| **Buzzer Acoustic Sound Grill** | **Ø 1.2 cm** (12.0 mm) | 7-hole acoustic matrix (Center Ø 0.3 cm, 6x Ø 0.2 cm) |
| **Wall Mounting Keyholes** | **11.0 cm** Center-to-Center | Dual M4 screw quick-release mounting |
| **In-Wall Cable Pass Hole** | **Ø 2.2 cm** (22.0 mm) | Central flush wall cable pass-through |
| **Bottom Cable Relief Notch** | **2.4 cm (W) × 0.8 cm (H)** | Notch for 12V maglock relay & DC power wires |
| **ESP32 DevKit Standoffs** | **2.6 cm (W) × 5.2 cm (H)** | 4x M2.5 pilot hole mounting standoffs |
| **Corner Assembly Screws** | **9.7 cm (W) × 16.7 cm (H)** | 4x M3 × 1.8 cm screws into M3 brass inserts |

---

## 📁 3D CAD Files & Technical Blueprints

| Resource | Description | Clickable Link |
| :--- | :--- | :--- |
| **Technical 2D CAD Blueprint** | 📐 Full orthographic 3-view blueprint with arrows, witness lines, and cm labels | [enclosure_dimension_blueprint.png](file:///d:/Tanmay/Desktop%20Support/3d_model/enclosure_dimension_blueprint.png) |
| **Interactive 3D WebGL Viewer** | 🌐 3D viewer with floating dimension arrows, cm badges, explode slider, and STL downloads | [enclosure_3d_viewer.html](file:///d:/Tanmay/Desktop%20Support/3d_model/enclosure_3d_viewer.html) |
| **3D Dimensions Perspective** | 🖼️ 3D render showing live dimension arrows (11.5cm, 18.5cm, 3.4cm) in 3D space | [enclosure_3d_dimensions.png](file:///d:/Tanmay/Desktop%20Support/3d_model/enclosure_3d_dimensions.png) |
| **Front Shell STL** | 🖨️ Slicer-ready front shell with all 5 cutouts | [terminal_front_shell.stl](file:///d:/Tanmay/Desktop%20Support/3d_model/terminal_front_shell.stl) |
| **Rear Baseplate STL** | 🖨️ Slicer-ready rear wall baseplate | [terminal_rear_baseplate.stl](file:///d:/Tanmay/Desktop%20Support/3d_model/terminal_rear_baseplate.stl) |
| **OpenSCAD Source Code** | 📐 Parametric CAD script for FreeCAD / OpenSCAD | [biometric_terminal_enclosure.scad](file:///d:/Tanmay/Desktop%20Support/3d_model/biometric_terminal_enclosure.scad) |

---

## ⚙️ Recommended 3D Slicer Settings
* **Material**: PETG or PLA+ (Matte Black or Industrial Slate Grey)
* **Layer Height**: `0.02 cm` (`0.20 mm`)
* **Perimeter Walls**: `4 Solid Walls` (`0.16 cm` thickness)
* **Infill**: `25% Gyroid`
* **Orientation**:
  - **Front Shell**: Print face flat down on textured PEI bed.
  - **Rear Baseplate**: Print back flat down on build plate.
