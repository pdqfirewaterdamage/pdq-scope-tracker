export type ItemStatus = 'pending' | 'done' | 'not_needed';

export interface ScopeItem {
  id: string;
  label: string;
  phase: string;
  subsection: string;
  childSub?: string;
  inputType?: 'pct' | 'qty' | 'lf' | 'sf' | 'drop';
  dropOptions?: string[];
  noHours?: boolean;
  mandatory?: boolean;
  hasNote?: boolean;
  forceHeader?: boolean;
  cat3Suffix?: boolean;
  requirePhoto?: boolean;
  sortOrder: number;
}

export interface ScopeSection {
  id: string;
  label: string;
  phase: string;
  subsection: string;
  items: ScopeItem[];
}

export interface RoomItem extends ScopeItem {
  status: ItemStatus;
  hours?: number;
  hoursType?: 'regular' | 'after';
  note?: string;
  photos?: string[];
  qtyValue?: string;
  dropValue?: string;
}

export const SCOPE_TEMPLATE: ScopeSection[] = [
  // ─── PHASE 1 ───────────────────────────────────────────────────────────────
  {
    id: 'phase1_extraction',
    label: 'Extraction',
    phase: '1',
    subsection: 'Extraction',
    items: [
      {
        id: 'p1_weighted_wand',
        label: 'Weighted wand extraction',
        phase: '1',
        subsection: 'Extraction',
        inputType: 'pct',
        sortOrder: 1,
      },
      {
        id: 'p1_wand_extraction',
        label: 'Wand extraction',
        phase: '1',
        subsection: 'Extraction',
        inputType: 'pct',
        sortOrder: 2,
      },
    ],
  },
  {
    id: 'phase1_antimicrobial',
    label: 'Antimicrobial Application',
    phase: '1',
    subsection: 'Antimicrobial Application',
    items: [
      {
        id: 'p1_antimicrobial',
        label: 'Antimicrobial application',
        phase: '1',
        subsection: 'Antimicrobial Application',
        inputType: 'pct',
        forceHeader: true,
        sortOrder: 3,
      },
    ],
  },
  {
    id: 'phase1_contents_emergency',
    label: 'Contents Manipulation Emergency',
    phase: '1',
    subsection: 'Contents Manipulation Emergency',
    items: [
      {
        id: 'p1_contents_manip',
        label: 'Contents manipulation',
        phase: '1',
        subsection: 'Contents Manipulation Emergency',
        inputType: 'drop',
        dropOptions: ['Small', 'Med', 'Large', 'XL'],
        forceHeader: true,
        sortOrder: 4,
      },
    ],
  },
  {
    id: 'phase1_containment',
    label: 'Containment Chamber',
    phase: '1',
    subsection: 'Containment Chamber',
    items: [
      {
        id: 'p1_poly_barrier',
        label: 'Poly barrier install',
        phase: '1',
        subsection: 'Containment Chamber',
        inputType: 'qty',
        sortOrder: 5,
      },
      {
        id: 'p1_neg_air',
        label: 'Negative air machine',
        phase: '1',
        subsection: 'Containment Chamber',
        inputType: 'qty',
        sortOrder: 6,
      },
      {
        id: 'p1_decon_chamber',
        label: 'Decon chamber',
        phase: '1',
        subsection: 'Containment Chamber',
        inputType: 'qty',
        sortOrder: 7,
      },
      {
        id: 'p1_warning_signage',
        label: 'Warning signage',
        phase: '1',
        subsection: 'Containment Chamber',
        inputType: 'qty',
        sortOrder: 8,
      },
      {
        id: 'p1_zip_wall',
        label: 'Zip wall',
        phase: '1',
        subsection: 'Containment Chamber',
        inputType: 'lf',
        sortOrder: 9,
      },
    ],
  },
  {
    id: 'phase1_equipment',
    label: 'Equipment / Stabilization',
    phase: '1',
    subsection: 'Equipment / Stabilization',
    items: [
      {
        id: 'p1_dehumidifier',
        label: 'Dehumidifier placement',
        phase: '1',
        subsection: 'Equipment / Stabilization',
        inputType: 'qty',
        noHours: true,
        sortOrder: 10,
      },
      {
        id: 'p1_portable_drainage',
        label: 'Portable drainage setup',
        phase: '1',
        subsection: 'Equipment / Stabilization',
        inputType: 'qty',
        noHours: true,
        sortOrder: 11,
      },
      {
        id: 'p1_air_scrubber',
        label: 'Air scrubber placement',
        phase: '1',
        subsection: 'Equipment / Stabilization',
        inputType: 'qty',
        noHours: true,
        sortOrder: 12,
      },
      {
        id: 'p1_hydroxyl',
        label: 'Hydroxyl Generator',
        phase: '1',
        subsection: 'Equipment / Stabilization',
        inputType: 'qty',
        noHours: true,
        cat3Suffix: true,
        sortOrder: 13,
      },
    ],
  },

  // ─── PHASE 3 ───────────────────────────────────────────────────────────────
  {
    id: 'phase3_demolition',
    label: 'Demolition',
    phase: '3',
    subsection: 'Demolition',
    items: [
      {
        id: 'p3_drill_holes',
        label: 'Drill holes for drying',
        phase: '3',
        subsection: 'Demolition',
        inputType: 'qty',
        sortOrder: 20,
      },
      {
        id: 'p3_subfloor_inspection',
        label: 'Subfloor inspection',
        phase: '3',
        subsection: 'Demolition',
        inputType: 'qty',
        sortOrder: 21,
      },
      // Walls childSub
      {
        id: 'p3_flood_cut',
        label: 'Flood cut drywall',
        phase: '3',
        subsection: 'Demolition',
        childSub: 'Walls',
        inputType: 'lf',
        sortOrder: 22,
      },
      {
        id: 'p3_remove_insulation_wall',
        label: 'Remove insulation',
        phase: '3',
        subsection: 'Demolition',
        childSub: 'Walls',
        inputType: 'sf',
        sortOrder: 23,
      },
      // Ceiling childSub
      {
        id: 'p3_remove_ceiling_drywall',
        label: 'Remove ceiling drywall',
        phase: '3',
        subsection: 'Demolition',
        childSub: 'Ceiling',
        inputType: 'sf',
        sortOrder: 24,
      },
      {
        id: 'p3_remove_ceiling_insulation',
        label: 'Remove ceiling insulation',
        phase: '3',
        subsection: 'Demolition',
        childSub: 'Ceiling',
        inputType: 'sf',
        sortOrder: 25,
      },
      // Flooring childSub — handled by FlooringSection chip UI
      {
        id: 'p3_flooring_carpet',
        label: 'Carpet',
        phase: '3',
        subsection: 'Demolition',
        childSub: 'Flooring',
        sortOrder: 26,
      },
      {
        id: 'p3_flooring_padding',
        label: 'Padding',
        phase: '3',
        subsection: 'Demolition',
        childSub: 'Flooring',
        sortOrder: 27,
      },
      {
        id: 'p3_flooring_tack',
        label: 'Tack Strip',
        phase: '3',
        subsection: 'Demolition',
        childSub: 'Flooring',
        sortOrder: 28,
      },
      {
        id: 'p3_flooring_vinyl',
        label: 'Vinyl',
        phase: '3',
        subsection: 'Demolition',
        childSub: 'Flooring',
        sortOrder: 29,
      },
      {
        id: 'p3_flooring_laminate',
        label: 'Laminate',
        phase: '3',
        subsection: 'Demolition',
        childSub: 'Flooring',
        sortOrder: 30,
      },
      {
        id: 'p3_flooring_hardwood',
        label: 'Hardwood',
        phase: '3',
        subsection: 'Demolition',
        childSub: 'Flooring',
        sortOrder: 31,
      },
      {
        id: 'p3_flooring_tile',
        label: 'Tile',
        phase: '3',
        subsection: 'Demolition',
        childSub: 'Flooring',
        sortOrder: 32,
      },
      {
        id: 'p3_flooring_scrape',
        label: 'Scrape',
        phase: '3',
        subsection: 'Demolition',
        childSub: 'Flooring',
        sortOrder: 33,
      },
    ],
  },
  {
    id: 'phase3_cleaning',
    label: 'Cleaning',
    phase: '3',
    subsection: 'Cleaning',
    items: [
      {
        id: 'p3_hepa_vacuum',
        label: 'HEPA vacuum',
        phase: '3',
        subsection: 'Cleaning',
        inputType: 'pct',
        sortOrder: 34,
      },
      {
        id: 'p3_antimicrobial_wipe',
        label: 'Antimicrobial wipe-down',
        phase: '3',
        subsection: 'Cleaning',
        inputType: 'pct',
        sortOrder: 35,
      },
      {
        id: 'p3_fogging',
        label: 'Fogging',
        phase: '3',
        subsection: 'Cleaning',
        inputType: 'pct',
        sortOrder: 36,
      },
      {
        id: 'p3_air_duct_cleaning',
        label: 'Air duct cleaning',
        phase: '3',
        subsection: 'Cleaning',
        inputType: 'qty',
        sortOrder: 37,
      },
      {
        id: 'p3_duct_sealing',
        label: 'Duct sealing',
        phase: '3',
        subsection: 'Cleaning',
        inputType: 'qty',
        sortOrder: 38,
      },
    ],
  },
  {
    id: 'phase3_drying',
    label: 'Drying Equipment Setup',
    phase: '3',
    subsection: 'Drying Equipment Setup',
    items: [
      {
        id: 'p3_air_mover',
        label: 'Air mover placement',
        phase: '3',
        subsection: 'Drying Equipment Setup',
        inputType: 'qty',
        noHours: true,
        sortOrder: 39,
      },
      {
        id: 'p3_dehumidifier_check',
        label: 'Dehumidifier check',
        phase: '3',
        subsection: 'Drying Equipment Setup',
        inputType: 'qty',
        noHours: true,
        sortOrder: 40,
      },
      {
        id: 'p3_moisture_readings',
        label: 'Moisture readings',
        phase: '3',
        subsection: 'Drying Equipment Setup',
        inputType: 'qty',
        requirePhoto: true,
        sortOrder: 41,
      },
    ],
  },
  {
    id: 'phase3_asbestos',
    label: 'Asbestos / Lead Testing',
    phase: '3',
    subsection: 'Asbestos / Lead Testing',
    items: [
      {
        id: 'p3_asbestos_sample',
        label: 'Asbestos sample collected',
        phase: '3',
        subsection: 'Asbestos / Lead Testing',
        inputType: 'qty',
        requirePhoto: true,
        sortOrder: 42,
      },
      {
        id: 'p3_lead_test',
        label: 'Lead test completed',
        phase: '3',
        subsection: 'Asbestos / Lead Testing',
        inputType: 'qty',
        requirePhoto: true,
        sortOrder: 43,
      },
    ],
  },
  {
    id: 'phase3_trash',
    label: 'Trash / Debris Removal',
    phase: '3',
    subsection: 'Trash / Debris Removal',
    items: [
      {
        id: 'p3_truck_haul',
        label: 'Pickup truck haul-out',
        phase: '3',
        subsection: 'Trash / Debris Removal',
        inputType: 'qty',
        sortOrder: 44,
      },
      {
        id: 'p3_dumpster_fill',
        label: 'Dumpster fill',
        phase: '3',
        subsection: 'Trash / Debris Removal',
        inputType: 'qty',
        sortOrder: 45,
      },
      {
        id: 'p3_bag_debris',
        label: 'Bag debris on-site',
        phase: '3',
        subsection: 'Trash / Debris Removal',
        inputType: 'qty',
        sortOrder: 46,
      },
    ],
  },

  // ─── GENERAL ───────────────────────────────────────────────────────────────
  {
    id: 'general_daily',
    label: 'General / Daily',
    phase: 'general',
    subsection: 'General / Daily',
    items: [
      {
        id: 'gen_ppe',
        label: 'Set up PPE',
        phase: 'general',
        subsection: 'General / Daily',
        noHours: true,
        sortOrder: 50,
      },
      {
        id: 'gen_check_equipment',
        label: 'Check & log all equipment',
        phase: 'general',
        subsection: 'General / Daily',
        noHours: true,
        sortOrder: 51,
      },
      {
        id: 'gen_moisture_am',
        label: 'Moisture readings - AM',
        phase: 'general',
        subsection: 'General / Daily',
        inputType: 'qty',
        sortOrder: 52,
      },
      {
        id: 'gen_moisture_pm',
        label: 'Moisture readings - PM',
        phase: 'general',
        subsection: 'General / Daily',
        inputType: 'qty',
        sortOrder: 53,
      },
      {
        id: 'gen_psychrometric',
        label: 'Psychrometric readings',
        phase: 'general',
        subsection: 'General / Daily',
        inputType: 'qty',
        sortOrder: 54,
      },
      {
        id: 'gen_photo_doc',
        label: 'Photo documentation',
        phase: 'general',
        subsection: 'General / Daily',
        noHours: true,
        requirePhoto: true,
        sortOrder: 55,
      },
      {
        id: 'gen_safety_walk',
        label: 'Safety walk',
        phase: 'general',
        subsection: 'General / Daily',
        noHours: true,
        sortOrder: 56,
      },
      {
        id: 'gen_client_comm',
        label: 'Client communication log',
        phase: 'general',
        subsection: 'General / Daily',
        noHours: true,
        sortOrder: 57,
      },
      {
        id: 'gen_eod_check',
        label: 'End of day equipment check',
        phase: 'general',
        subsection: 'General / Daily',
        noHours: true,
        requirePhoto: true,
        sortOrder: 58,
      },
    ],
  },
  {
    id: 'general_electrician',
    label: 'Electrician Required?',
    phase: 'general',
    subsection: 'Electrician Required?',
    items: [
      {
        id: 'elec_ceiling_fan',
        label: 'Ceiling fan disconnect',
        phase: 'general',
        subsection: 'Electrician Required?',
        hasNote: false,
        sortOrder: 59,
      },
      {
        id: 'elec_dishwasher_circuit',
        label: 'Dishwasher circuit',
        phase: 'general',
        subsection: 'Electrician Required?',
        sortOrder: 60,
      },
      {
        id: 'elec_microwave_circuit',
        label: 'Microwave circuit',
        phase: 'general',
        subsection: 'Electrician Required?',
        sortOrder: 61,
      },
      {
        id: 'elec_garbage_disposal',
        label: 'Garbage disposal',
        phase: 'general',
        subsection: 'Electrician Required?',
        sortOrder: 62,
      },
      {
        id: 'elec_safety_check',
        label: 'Electric safety check',
        phase: 'general',
        subsection: 'Electrician Required?',
        sortOrder: 63,
      },
      {
        id: 'elec_other',
        label: 'Other - electrical',
        phase: 'general',
        subsection: 'Electrician Required?',
        hasNote: true,
        sortOrder: 64,
      },
    ],
  },
  {
    id: 'general_plumber',
    label: 'Plumber Required?',
    phase: 'general',
    subsection: 'Plumber Required?',
    items: [
      {
        id: 'plumb_dishwasher',
        label: 'Remove dishwasher',
        phase: 'general',
        subsection: 'Plumber Required?',
        sortOrder: 65,
      },
      {
        id: 'plumb_faucets',
        label: 'Remove faucets/drain',
        phase: 'general',
        subsection: 'Plumber Required?',
        sortOrder: 66,
      },
      {
        id: 'plumb_toilet',
        label: 'Remove toilet',
        phase: 'general',
        subsection: 'Plumber Required?',
        sortOrder: 67,
      },
      {
        id: 'plumb_other',
        label: 'Other - plumbing',
        phase: 'general',
        subsection: 'Plumber Required?',
        hasNote: true,
        sortOrder: 68,
      },
    ],
  },

  // ─── FIRE / SMOKE RESTORATION ──────────────────────────────────────────────
  {
    id: 'fire_containment',
    label: 'Fire Containment',
    phase: 'fire',
    subsection: 'Fire Containment',
    items: [
      {
        id: 'fire_boardup',
        label: 'Board up / secure structure',
        phase: 'fire',
        subsection: 'Fire Containment',
        sortOrder: 100,
      },
      {
        id: 'fire_containment_smoke',
        label: 'Set up containment for smoke areas',
        phase: 'fire',
        subsection: 'Fire Containment',
        sortOrder: 101,
      },
    ],
  },
  {
    id: 'fire_demolition',
    label: 'Demolition',
    phase: 'fire',
    subsection: 'Demolition',
    items: [
      {
        id: 'fire_remove_debris',
        label: 'Remove debris / charred materials',
        phase: 'fire',
        subsection: 'Demolition',
        sortOrder: 102,
      },
      {
        id: 'fire_remove_insulation',
        label: 'Remove smoke-damaged insulation',
        phase: 'fire',
        subsection: 'Demolition',
        sortOrder: 103,
      },
    ],
  },
  {
    id: 'fire_smoke_cleaning',
    label: 'Smoke Cleaning',
    phase: 'fire',
    subsection: 'Smoke Cleaning',
    items: [
      {
        id: 'fire_hepa_vacuum',
        label: 'HEPA vacuum soot from surfaces',
        phase: 'fire',
        subsection: 'Smoke Cleaning',
        sortOrder: 104,
      },
      {
        id: 'fire_dry_sponge',
        label: 'Dry sponge walls & ceilings',
        phase: 'fire',
        subsection: 'Smoke Cleaning',
        sortOrder: 105,
      },
      {
        id: 'fire_clean_contents',
        label: 'Clean / deodorize affected contents',
        phase: 'fire',
        subsection: 'Smoke Cleaning',
        sortOrder: 106,
      },
      {
        id: 'fire_ozone_hydroxyl',
        label: 'Ozone / hydroxyl treatment',
        phase: 'fire',
        subsection: 'Smoke Cleaning',
        noHours: true,
        inputType: 'qty',
        sortOrder: 107,
      },
      {
        id: 'fire_thermal_fogging',
        label: 'Thermal fogging',
        phase: 'fire',
        subsection: 'Smoke Cleaning',
        inputType: 'qty',
        sortOrder: 108,
      },
      {
        id: 'fire_seal_encapsulate',
        label: 'Seal / encapsulate smoke-damaged surfaces',
        phase: 'fire',
        subsection: 'Smoke Cleaning',
        sortOrder: 109,
      },
    ],
  },
  {
    id: 'fire_documentation',
    label: 'Documentation',
    phase: 'fire',
    subsection: 'Documentation',
    items: [
      {
        id: 'fire_photo_doc',
        label: 'Photo-document all affected areas',
        phase: 'fire',
        subsection: 'Documentation',
        requirePhoto: true,
        sortOrder: 110,
      },
    ],
  },

  // ─── RECONSTRUCTION ────────────────────────────────────────────────────────
  {
    id: 'recon_drywall',
    label: 'Drywall',
    phase: 'recon',
    subsection: 'Drywall',
    items: [
      {
        id: 'recon_hang_drywall',
        label: 'Hang new drywall',
        phase: 'recon',
        subsection: 'Drywall',
        inputType: 'sf',
        sortOrder: 200,
      },
      {
        id: 'recon_tape_mud',
        label: 'Tape & mud drywall',
        phase: 'recon',
        subsection: 'Drywall',
        inputType: 'sf',
        sortOrder: 201,
      },
      {
        id: 'recon_sand_prep',
        label: 'Sand & prep drywall for paint',
        phase: 'recon',
        subsection: 'Drywall',
        sortOrder: 202,
      },
    ],
  },
  {
    id: 'recon_finishing',
    label: 'Finishing',
    phase: 'recon',
    subsection: 'Finishing',
    items: [
      {
        id: 'recon_prime',
        label: 'Prime walls / ceilings',
        phase: 'recon',
        subsection: 'Finishing',
        inputType: 'sf',
        sortOrder: 203,
      },
      {
        id: 'recon_paint',
        label: 'Paint walls / ceilings',
        phase: 'recon',
        subsection: 'Finishing',
        inputType: 'sf',
        sortOrder: 204,
      },
      {
        id: 'recon_baseboards',
        label: 'Install new baseboards',
        phase: 'recon',
        subsection: 'Finishing',
        inputType: 'lf',
        sortOrder: 205,
      },
      {
        id: 'recon_trim_casing',
        label: 'Install trim / door casing',
        phase: 'recon',
        subsection: 'Finishing',
        inputType: 'lf',
        sortOrder: 206,
      },
      {
        id: 'recon_cabinetry',
        label: 'Install new cabinetry',
        phase: 'recon',
        subsection: 'Finishing',
        sortOrder: 207,
      },
      {
        id: 'recon_touchup_paint',
        label: 'Touch-up paint',
        phase: 'recon',
        subsection: 'Finishing',
        sortOrder: 208,
      },
    ],
  },
  {
    id: 'recon_flooring',
    label: 'Flooring',
    phase: 'recon',
    subsection: 'Flooring',
    items: [
      {
        id: 'recon_flooring_general',
        label: 'Install new flooring',
        phase: 'recon',
        subsection: 'Flooring',
        inputType: 'sf',
        sortOrder: 209,
      },
      {
        id: 'recon_carpet_pad',
        label: 'Install new carpet & pad',
        phase: 'recon',
        subsection: 'Flooring',
        inputType: 'sf',
        sortOrder: 210,
      },
    ],
  },
  {
    id: 'recon_rough_in',
    label: 'Rough-In',
    phase: 'recon',
    subsection: 'Rough-In',
    items: [
      {
        id: 'recon_insulation',
        label: 'Install new insulation',
        phase: 'recon',
        subsection: 'Rough-In',
        inputType: 'sf',
        sortOrder: 211,
      },
      {
        id: 'recon_plumbing',
        label: 'Plumbing rough-in / repair',
        phase: 'recon',
        subsection: 'Rough-In',
        sortOrder: 212,
      },
      {
        id: 'recon_electrical',
        label: 'Electrical rough-in / repair',
        phase: 'recon',
        subsection: 'Rough-In',
        sortOrder: 213,
      },
    ],
  },
  {
    id: 'recon_closeout',
    label: 'Closeout',
    phase: 'recon',
    subsection: 'Closeout',
    items: [
      {
        id: 'recon_final_clean',
        label: 'Final clean / detail',
        phase: 'recon',
        subsection: 'Closeout',
        sortOrder: 214,
      },
      {
        id: 'recon_final_walkthrough',
        label: 'Final walk-through / punch list',
        phase: 'recon',
        subsection: 'Closeout',
        sortOrder: 215,
      },
    ],
  },
];

export const ROOM_PRESETS: string[] = [
  'Living Room',
  'Kitchen',
  'Master Bedroom',
  'Bedroom',
  'Bathroom',
  'Master Bathroom',
  'Hallway',
  'Basement',
  'Garage',
  'Laundry Room',
  'Dining Room',
  'Office',
  'Crawl Space',
  'Attic',
];

export function makeRoomItems(
  waterCategory: 'cat2' | 'cat3',
  jobType: string = 'Water Mitigation',
): RoomItem[] {
  const isCat3 = waterCategory === 'cat3';

  // Filter sections by job type
  const phasesForJob: Record<string, string[]> = {
    'Water Mitigation': ['1', '3', 'general'],
    'Fire & Smoke': ['fire', 'general'],
    'Reconstruction': ['recon', 'general'],
    'General': ['general'],
  };
  const allowedPhases = phasesForJob[jobType] ?? ['1', '3', 'general'];

  const allItems: ScopeItem[] = SCOPE_TEMPLATE
    .filter((section) => allowedPhases.includes(section.phase))
    .flatMap((section) => section.items);

  return allItems.map((item): RoomItem => {
    let label = item.label;
    let mandatory = item.mandatory ?? false;

    if (isCat3 && item.cat3Suffix) {
      label = `${item.label} — Cat 3`;
      mandatory = true;
    }

    return {
      ...item,
      label,
      mandatory,
      status: 'pending',
      hours: undefined,
      hoursType: 'regular',
      note: '',
      photos: [],
      qtyValue: undefined,
      dropValue: undefined,
    };
  });
}

export function countPendingItems(items: RoomItem[]): {
  pending: number;
  doneWithoutHours: number;
} {
  let pending = 0;
  let doneWithoutHours = 0;

  for (const item of items) {
    if (item.status === 'pending') {
      pending++;
    } else if (item.status === 'done' && !item.noHours) {
      if (item.hours === undefined || item.hours === null || item.hours <= 0) {
        doneWithoutHours++;
      }
    }
  }

  return { pending, doneWithoutHours };
}
