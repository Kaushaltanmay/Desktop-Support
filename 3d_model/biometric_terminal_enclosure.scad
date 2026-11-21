/*
 ==============================================================================
  FLY MEDIA TECHNOLOGY — 3D BIOMETRIC & RFID ACCESS CONTROL ENCLOSURE
 ==============================================================================
  Parametric 3D CAD Enclosure Model in OpenSCAD (Rev 2.0)
  Features ALL 5 Hardware Cutouts:
    1. 2.8" SPI TFT Touch LCD Window (48 × 65 mm)
    2. RC522 RFID 13.56 MHz Card Tap Window (42 × 58 mm)
    3. R307 Optical Fingerprint Scanner Well (24 × 20 mm)
    4. 5mm RGB Status LED Bezel Collar (Ø 6.5 mm)
    5. Piezo Audio Buzzer 7-Hole Acoustic Matrix (Center 3.0mm, 6x 2.0mm)
    6. M3 Corner Heat-Set Inserts & Rear Counterbores
    7. Dual Wall-Mount Keyhole Slots & Cable Relief

  Render Options:
    - Set 'render_mode = 0' for Exploded Assembly Preview
    - Set 'render_mode = 1' for Front Shell Only (Print face down)
    - Set 'render_mode = 2' for Rear Wall Baseplate (Print back down)
 ==============================================================================
*/

// ================= RENDER SELECTION =================
render_mode  = 0;  // [0: Exploded Assembly Preview, 1: Front Shell, 2: Rear Baseplate]
explode_dist = 55; // Distance between shells in assembly preview (mm)

// ================= PRIMARY DIMENSIONS =================
$fn = 40; // High circular resolution

case_width       = 115;  // X dimension (mm)
case_height      = 185;  // Y dimension (mm)
case_depth_front = 18;   // Z depth of front shell (mm)
case_depth_back  = 16;   // Z depth of rear baseplate (mm)
wall_thick       = 2.4;  // Shell thickness (4 solid perimeters)
corner_rad       = 9.0;  // Exterior corner rounding radius

// 1. 2.8" SPI TFT Display Cutout Specs
tft_window_w = 48.0;
tft_window_h = 65.0;
tft_y_offset = 48.0;

// 2. RC522 RFID Card Cutout Specs
rfid_window_w = 42.0;
rfid_window_h = 58.0;
rfid_y_offset = -12.0;

// 3. R307 Optical Fingerprint Scanner Cutout Specs
r307_cutout_w = 24.0;
r307_cutout_h = 20.0;
r307_y_offset = -65.0;

// 4. Status Indicator Cutouts (Right Side at X = +38mm)
led_hole_dia     = 6.5;
led_x_offset     = 38.0;
led_y_offset     = 65.0;

buzzer_x_offset  = 38.0;
buzzer_y_offset  = 35.0;

// Hardware & Standoff Specs
screw_m3_clearance = 3.3; // Through hole for M3 screw
m3_insert_dia      = 4.2; // Hole for M3 brass threaded heat-set insert
m3_insert_depth    = 5.5;
corner_boss_dia    = 9.0;

// ESP32 DevKit Standoffs (Rear Shell)
esp32_mount_w = 26.0;
esp32_mount_h = 52.0;

// ================= HELPER MODULES =================
module rounded_box(w, h, d, r) {
  translate([r, r, 0])
    minkowski() {
      cube([w - 2*r, h - 2*r, d/2]);
      cylinder(r=r, h=d/2);
    }
}

module keyhole() {
  union() {
    cylinder(r=4.2, h=wall_thick*3, center=true);
    translate([0, 6, 0]) cylinder(r=2.2, h=wall_thick*3, center=true);
    translate([-2.2, 0, -wall_thick*1.5]) cube([4.4, 6, wall_thick*3]);
  }
}

// ================= 1. FRONT BEZEL SHELL =================
module front_shell() {
  difference() {
    // Outer Shell
    rounded_box(case_width, case_height, case_depth_front, corner_rad);

    // Inner Cavity Hollow
    translate([wall_thick, wall_thick, -0.01])
      rounded_box(case_width - 2*wall_thick, case_height - 2*wall_thick, case_depth_front - wall_thick, corner_rad - 1.5);

    // CUTOUT 1: 2.8" TFT Screen Window
    translate([case_width/2 - tft_window_w/2, case_height/2 + tft_y_offset - tft_window_h/2, -1])
      cube([tft_window_w, tft_window_h, wall_thick + 2]);

    // CUTOUT 2: RC522 RFID Card Window
    translate([case_width/2 - rfid_window_w/2, case_height/2 + rfid_y_offset - rfid_window_h/2, -1])
      cube([rfid_window_w, rfid_window_h, wall_thick + 2]);

    // CUTOUT 3: R307 Optical Fingerprint Scanner Well
    translate([case_width/2, case_height/2 + r307_y_offset, 0]) {
      cube([r307_cutout_w, r307_cutout_h, wall_thick*3], center=true);
      translate([0, 0, -0.5]) scale([1.15, 1.15, 1]) cube([r307_cutout_w, r307_cutout_h, 2], center=true);
    }

    // CUTOUT 4: 5mm RGB LED Bezel Hole (Ø 6.5mm)
    translate([case_width/2 + led_x_offset, case_height/2 + led_y_offset, -1])
      cylinder(r=led_hole_dia/2, h=wall_thick + 2);

    // CUTOUT 5: Audio Buzzer 7-Hole Acoustic Grill
    translate([case_width/2 + buzzer_x_offset, case_height/2 + buzzer_y_offset, 0]) {
      cylinder(r=1.5, h=wall_thick*3, center=true); // Center 3.0mm
      for (a = [0:60:300]) {
        translate([cos(a)*4.2, sin(a)*4.2, 0])
          cylinder(r=1.0, h=wall_thick*3, center=true); // 2.0mm vents
      }
    }

    // Corner M3 Heat-Set Insert Holes
    for (x = [corner_boss_dia/2 + 2, case_width - corner_boss_dia/2 - 2]) {
      for (y = [corner_boss_dia/2 + 2, case_height - corner_boss_dia/2 - 2]) {
        translate([x, y, -0.1]) cylinder(r=m3_insert_dia/2, h=m3_insert_depth);
      }
    }
  }

  // Corner Bosses for M3 Brass Inserts
  for (x = [corner_boss_dia/2 + 2, case_width - corner_boss_dia/2 - 2]) {
    for (y = [corner_boss_dia/2 + 2, case_height - corner_boss_dia/2 - 2]) {
      difference() {
        translate([x, y, 0]) cylinder(r=corner_boss_dia/2, h=case_depth_front - 2);
        translate([x, y, -0.1]) cylinder(r=m3_insert_dia/2, h=m3_insert_depth);
      }
    }
  }

  // Raised Collar for RGB LED Bezel
  translate([case_width/2 + led_x_offset, case_height/2 + led_y_offset, case_depth_front])
    difference() {
      cylinder(r=4.8, h=1.5);
      translate([0, 0, -0.1]) cylinder(r=led_hole_dia/2, h=2);
    }
}

// ================= 2. REAR WALL BASEPLATE SHELL =================
module rear_shell() {
  difference() {
    rounded_box(case_width, case_height, case_depth_back, corner_rad);

    // Inner Cavity Hollow
    translate([wall_thick, wall_thick, wall_thick])
      rounded_box(case_width - 2*wall_thick, case_height - 2*wall_thick, case_depth_back + 1, corner_rad - 1.5);

    // Dual Wall Keyhole Mounting Slots
    translate([case_width/2, case_height - 40, 0]) keyhole();
    translate([case_width/2, 40, 0]) keyhole();

    // Corner Screw Counterbores (M3 Flush Head)
    for (x = [corner_boss_dia/2 + 2, case_width - corner_boss_dia/2 - 2]) {
      for (y = [corner_boss_dia/2 + 2, case_height - corner_boss_dia/2 - 2]) {
        translate([x, y, -1]) cylinder(r=screw_m3_clearance/2, h=case_depth_back + 2);
        translate([x, y, -0.1]) cylinder(r=3.2, h=3.0);
      }
    }

    // Bottom Cable Entry Notch
    translate([case_width/2 - 12, -1, wall_thick + 2]) cube([24, wall_thick + 2, 8]);

    // Center Wall Pass-through Hole
    translate([case_width/2, case_height/2, -1]) cylinder(r=11.0, h=wall_thick + 2);
  }

  // Internal ESP32 DevKit 4 Standoffs
  translate([case_width/2, case_height/2, wall_thick]) {
    for (dx = [-esp32_mount_w/2, esp32_mount_w/2]) {
      for (dy = [-esp32_mount_h/2, esp32_mount_h/2]) {
        translate([dx, dy, 0])
          difference() {
            cylinder(r=3.0, h=6.5);
            cylinder(r=1.2, h=7.0);
          }
      }
    }
  }
}

// ================= RENDER OUTPUT =================
if (render_mode == 0) {
  color("#1e293b", 0.95) front_shell();
  translate([0, 0, case_depth_front + explode_dist])
    rotate([180, 0, 0])
      translate([-case_width, 0, -case_depth_back])
        color("#334155", 0.9) rear_shell();
} else if (render_mode == 1) {
  rotate([180, 0, 0]) translate([-case_width, 0, -case_depth_front]) front_shell();
} else if (render_mode == 2) {
  rear_shell();
}
