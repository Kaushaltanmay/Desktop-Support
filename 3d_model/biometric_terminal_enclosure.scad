/*
 ==============================================================================
  FLY MEDIA TECHNOLOGY — COMMERCIAL BIOMETRIC & RFID ACCESS CONTROL ENCLOSURE
 ==============================================================================
  Parametric 3D CAD Enclosure Model in OpenSCAD
  Designed for:
    - 2.8" SPI TFT Touch LCD (ILI9341 + XPT2046)
    - R307 Optical Fingerprint Sensor (Ergonomic 15° angled thumb rest)
    - RC522 13.56 MHz RFID Card Reader (Internal stealth mount behind tap zone)
    - ESP32 38-Pin DevKit V1 Board
    - 5mm RGB Status LED Light Pipe
    - Piezo Audio Buzzer Grill
    - M3 Heat-Set Brass Inserts & Screws
    - Wall Keyhole Mounting Slots & Cable Relief

  Instructions:
    - Set 'render_mode' to 0 for Full Assembly Preview
    - Set 'render_mode' to 1 for Front Shell (Print face down)
    - Set 'render_mode' to 2 for Rear Wall Baseplate (Print back down)
 ==============================================================================
*/

// ================= RENDER SELECTION =================
render_mode = 0; // [0: Exploded Assembly Preview, 1: Front Case Only, 2: Rear Baseplate Only]
explode_dist = 40; // Distance between shells in assembly preview (mm)

// ================= PRIMARY DIMENSIONS =================
$fn = 40; // Smooth circles

// Overall Enclosure Dimensions
case_width  = 110;  // X dimension (mm)
case_height = 165;  // Y dimension (mm)
case_depth_front = 18; // Z depth of front bezel shell
case_depth_back  = 14; // Z depth of rear base shell
wall_thick  = 2.4;  // Shell thickness (4-6 perimeters with 0.4mm nozzle)
corner_rad  = 8.0;  // Exterior corner rounding radius

// 2.8" TFT LCD Display Specs (Portrait Orientation)
tft_window_w = 46.0; // Visible glass width
tft_window_h = 61.0; // Visible glass height
tft_pcb_w    = 50.5; // Outer PCB width
tft_pcb_h    = 86.0; // Outer PCB height
tft_y_offset = 36.0; // Center Y offset from middle

// R307 Fingerprint Sensor Specs
r307_cutout_w = 20.5;
r307_cutout_h = 16.5;
r307_y_offset = -48.0; // Center Y offset from middle

// RC522 RFID Zone Specs
rfid_pcb_w = 40.0;
rfid_pcb_h = 60.0;
rfid_y_offset = -3.0; // Located between Screen and Fingerprint

// Hardware & Standoff Specs
screw_m3_clearance = 3.3; // Through hole for M3 screw
m3_insert_dia      = 4.2; // Pilot hole for M3 heat-set brass threaded insert
m3_insert_depth    = 5.5; // Insert depth
corner_boss_dia    = 9.0; // Standoff outer diameter

// ESP32 DevKit Standoffs (Rear Shell)
esp32_mount_w = 24.5;
esp32_mount_h = 51.5;

// ================= HELPER MODULES =================
module rounded_box(w, h, d, r) {
  translate([r, r, 0])
    minkowski() {
      cube([w - 2*r, h - 2*r, d/2]);
      cylinder(r=r, h=d/2);
    }
}

// Keyhole mounting slot for wall screws
module keyhole() {
  union() {
    cylinder(r=4.2, h=wall_thick*3, center=true); // 8.4mm head entry
    translate([0, 6, 0])
      cylinder(r=2.2, h=wall_thick*3, center=true); // 4.4mm shaft slot
    translate([-2.2, 0, -wall_thick*1.5])
      cube([4.4, 6, wall_thick*3]);
  }
}

// ================= 1. FRONT BEZEL SHELL =================
module front_shell() {
  difference() {
    // Solid Outer Shell
    rounded_box(case_width, case_height, case_depth_front, corner_rad);

    // Inner Cavity Hollow
    translate([wall_thick, wall_thick, -0.01])
      rounded_box(case_width - 2*wall_thick, case_height - 2*wall_thick, case_depth_front - wall_thick, corner_rad - 1);

    // 1. TFT LCD Screen Window Cutout
    translate([case_width/2 - tft_window_w/2, case_height/2 + tft_y_offset - tft_window_h/2, -1])
      cube([tft_window_w, tft_window_h, wall_thick + 2]);

    // 2. R307 Fingerprint Sensor Cutout & Angled Thumb Rest (15° slant)
    translate([case_width/2, case_height/2 + r307_y_offset, 0]) {
      // Finger Window
      cube([r307_cutout_w, r307_cutout_h, wall_thick*3], center=true);
      // Ergonomic Chamfer
      translate([0, 0, -0.5])
        scale([1.2, 1.2, 1])
          cube([r307_cutout_w, r307_cutout_h, 1.5], center=true);
    }

    // 3. 5mm RGB LED Light Pipe Hole
    translate([case_width/2 + 35, case_height/2 + tft_y_offset + 15, -1])
      cylinder(r=2.6, h=wall_thick + 2); // 5.2mm diameter

    // 4. Buzzer Sound Grill (5-hole acoustic matrix)
    translate([case_width/2 + 35, case_height/2 + tft_y_offset - 15, 0]) {
      cylinder(r=1.2, h=wall_thick*3, center=true);
      translate([3, 0, 0])  cylinder(r=1.0, h=wall_thick*3, center=true);
      translate([-3, 0, 0]) cylinder(r=1.0, h=wall_thick*3, center=true);
      translate([0, 3, 0])  cylinder(r=1.0, h=wall_thick*3, center=true);
      translate([0, -3, 0]) cylinder(r=1.0, h=wall_thick*3, center=true);
    }

    // 5. Stylus Pen Clip Groove (Right side exterior)
    translate([case_width - wall_thick - 1, case_height/2 - 25, case_depth_front/2])
      rotate([0, 90, 0])
        cylinder(r=4.0, h=wall_thick + 2);

    // 6. Corner M3 Heat-Set Insert Holes
    for (x = [corner_boss_dia/2 + 2, case_width - corner_boss_dia/2 - 2]) {
      for (y = [corner_boss_dia/2 + 2, case_height - corner_boss_dia/2 - 2]) {
        translate([x, y, -0.1])
          cylinder(r=m3_insert_dia/2, h=m3_insert_depth);
      }
    }
  }

  // --- Internal Mounting Posts & Retention Ribs ---
  // A. Corner Bosses for M3 Threaded Inserts
  for (x = [corner_boss_dia/2 + 2, case_width - corner_boss_dia/2 - 2]) {
    for (y = [corner_boss_dia/2 + 2, case_height - corner_boss_dia/2 - 2]) {
      difference() {
        translate([x, y, 0])
          cylinder(r=corner_boss_dia/2, h=case_depth_front - 2);
        translate([x, y, -0.1])
          cylinder(r=m3_insert_dia/2, h=m3_insert_depth);
      }
    }
  }

  // B. 2.8" TFT PCB Locating Ribs & Standoffs
  translate([case_width/2, case_height/2 + tft_y_offset, 0]) {
    // 4 Corner Locators
    for (dx = [-tft_pcb_w/2, tft_pcb_w/2]) {
      for (dy = [-tft_pcb_h/2, tft_pcb_h/2]) {
        translate([dx, dy, 0])
          cylinder(r=3.0, h=6.0);
      }
    }
  }

  // C. RC522 RFID Card Reader Internal Snap Clips
  // Suspends RC522 1.2mm behind front wall for maximum RF coupling
  translate([case_width/2, case_height/2 + rfid_y_offset, 0]) {
    for (dx = [-rfid_pcb_w/2 - 1, rfid_pcb_w/2 + 1]) {
      translate([dx, -rfid_pcb_h/4, 0])
        cube([2.0, 8.0, 7.0]);
      translate([dx, rfid_pcb_h/4, 0])
        cube([2.0, 8.0, 7.0]);
    }
  }

  // D. Embossed RFID Card Tap Graphic (Outside Face)
  translate([case_width/2, case_height/2 + rfid_y_offset, -0.6]) {
    difference() {
      cube([42, 28, 0.6], center=true);
      cube([39, 25, 0.8], center=true);
    }
  }
}

// ================= 2. REAR WALL BASEPLATE SHELL =================
module rear_shell() {
  difference() {
    // Baseplate Outer Body with Lip for Interlocking Dust Seal
    rounded_box(case_width, case_height, case_depth_back, corner_rad);

    // Inner Cavity Hollow
    translate([wall_thick, wall_thick, wall_thick])
      rounded_box(case_width - 2*wall_thick, case_height - 2*wall_thick, case_depth_back + 1, corner_rad - 1);

    // 1. Dual Keyhole Wall Mounting Slots
    translate([case_width/2, case_height - 35, 0]) keyhole();
    translate([case_width/2, 35, 0]) keyhole();

    // 2. Corner Screw Counterbores (M3 Flush Head from rear)
    for (x = [corner_boss_dia/2 + 2, case_width - corner_boss_dia/2 - 2]) {
      for (y = [corner_boss_dia/2 + 2, case_height - corner_boss_dia/2 - 2]) {
        translate([x, y, -1])
          cylinder(r=screw_m3_clearance/2, h=case_depth_back + 2); // Screw shank
        translate([x, y, -0.1])
          cylinder(r=3.2, h=3.0); // M3 Socket/Pan Head Counterbore
      }
    }

    // 3. Bottom Cable Entry Channel (Power 5V/12V & Maglock Relay Pair)
    translate([case_width/2 - 12, -1, wall_thick + 2])
      cube([24, wall_thick + 2, 7]);

    // 4. Rear Wall Cable Pass-through Hole (Concealed In-Wall Wiring)
    translate([case_width/2, case_height/2, -1])
      cylinder(r=10.0, h=wall_thick + 2);
  }

  // --- Internal ESP32 DevKit Standoffs ---
  translate([case_width/2, case_height/2 - 10, wall_thick]) {
    for (dx = [-esp32_mount_w/2, esp32_mount_w/2]) {
      for (dy = [-esp32_mount_h/2, esp32_mount_h/2]) {
        translate([dx, dy, 0])
          difference() {
            cylinder(r=3.0, h=6.5);
            cylinder(r=1.2, h=7.0); // M2.5 self-tapping pilot hole
          }
      }
    }
  }

  // --- Perimeter Interlocking Lip (Dust & Light Baffle) ---
  translate([wall_thick + 0.3, wall_thick + 0.3, case_depth_back])
    difference() {
      rounded_box(case_width - 2*(wall_thick + 0.3), case_height - 2*(wall_thick + 0.3), 2.5, corner_rad - 1.5);
      translate([1.5, 1.5, -0.1])
        rounded_box(case_width - 2*(wall_thick + 0.3) - 3, case_height - 2*(wall_thick + 0.3) - 3, 3, corner_rad - 2.5);
    }
}

// ================= RENDER LOGIC =================
if (render_mode == 0) {
  // Exploded View Assembly
  color("#1e293b", 0.95) front_shell();
  translate([0, 0, case_depth_front + explode_dist])
    rotate([180, 0, 0])
      translate([-case_width, 0, -case_depth_back])
        color("#334155", 0.9) rear_shell();
} else if (render_mode == 1) {
  // Ready to slice: Front Shell (Face down on bed)
  rotate([180, 0, 0])
    translate([-case_width, 0, -case_depth_front])
      front_shell();
} else if (render_mode == 2) {
  // Ready to slice: Rear Baseplate (Flat back on bed)
  rear_shell();
}
