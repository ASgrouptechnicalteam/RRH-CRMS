/**
 * Acceptance tests for the pricing engine.
 *
 * The two headline cases are taken verbatim from the product spec
 * (`projects (1).md`) — Plot 001 and Flat A-503. If the engine reproduces those
 * rupee-for-rupee, the maths matches what the business already works with.
 */

import {
  computePrice,
  resolveFinalPrice,
  ruleMatchesUnit,
  PricingRule,
  PricingUnitInput,
} from '../../apps/api/src/services/pricing/engine';
import {
  areaFromDimensions,
  convertArea,
  dimensionsDisagree,
  formatAreaDual,
  loadingFactor,
  normalizeArea,
  resolveBasisAreaSqft,
  toSqft,
  validateFlatAreas,
} from '../../apps/api/src/shared/measurement';

const rule = (
  r: Partial<PricingRule> &
    Pick<PricingRule, 'id' | 'label' | 'kind' | 'category' | 'calc_method' | 'rate'>,
): PricingRule => ({
  is_mandatory: true,
  is_active: true,
  sort_order: 0,
  ...r,
});

describe('measurement', () => {
  it('converts every unit to sq.ft using one table', () => {
    expect(toSqft(1, 'SQFT')).toBe(1);
    expect(toSqft(150, 'SQYD')).toBe(1350);
    expect(toSqft(1, 'ACRE')).toBe(43560);
    expect(toSqft(40, 'GUNTA')).toBe(43560); // 40 guntas = 1 acre
    expect(toSqft(100, 'CENT')).toBe(43560); // 100 cents = 1 acre
    expect(toSqft(1, 'ANKANAM')).toBe(72); // 1 ankanam = 8 sq.yd
  });

  it('round-trips conversions in both directions', () => {
    for (const unit of ['SQYD', 'SQM', 'ACRE', 'GUNTA', 'CENT', 'ANKANAM', 'HECTARE'] as const) {
      const back = convertArea(convertArea(250, 'SQFT', unit), unit, 'SQFT');
      expect(back).toBeCloseTo(250, 2);
    }
  });

  it('normalises an entered area into both canonical measures', () => {
    expect(normalizeArea(150, 'SQYD')).toEqual({
      area_value: 150,
      area_unit: 'SQYD',
      area_sqft: 1350,
      area_sqyd: 150,
    });
  });

  it('derives plot area from length x width', () => {
    expect(areaFromDimensions(50, 27)).toEqual({ area_sqft: 1350, area_sqyd: 150 });
  });

  it('flags dimensions that disagree with the entered area', () => {
    expect(dimensionsDisagree(1350, 50, 27)).toBe(false);
    expect(dimensionsDisagree(1350, 60, 45)).toBe(true); // 2700 vs 1350
    expect(dimensionsDisagree(1350, 50, 27.2)).toBe(false); // within 2%
  });

  it('computes the loading factor buyers actually ask about', () => {
    // Spec's A-503: carpet 1250, super built-up 1750 -> 40% loading
    expect(loadingFactor(1250, 1750)).toBe(0.4);
    expect(loadingFactor(0, 1750)).toBeNull();
  });

  it('rejects physically impossible flat areas', () => {
    const ok = validateFlatAreas({
      carpet_area_sqft: 1250,
      built_up_area_sqft: 1450,
      super_built_up_area_sqft: 1750,
    });
    expect(ok.filter((i) => i.severity === 'error')).toHaveLength(0);

    const bad = validateFlatAreas({
      carpet_area_sqft: 1450,
      built_up_area_sqft: 1250,
      super_built_up_area_sqft: 1750,
    });
    expect(bad.some((i) => i.severity === 'error')).toBe(true);
  });

  it('resolves the area a rate multiplies from the price basis', () => {
    const areas = {
      carpet_area_sqft: 1250,
      built_up_area_sqft: 1450,
      super_built_up_area_sqft: 1750,
      plot_area_sqyd: 150,
    };
    expect(resolveBasisAreaSqft('CARPET', areas)).toBe(1250);
    expect(resolveBasisAreaSqft('SUPER_BUILT_UP', areas)).toBe(1750);
    expect(resolveBasisAreaSqft('PLOT_AREA', areas)).toBe(1350);
    expect(resolveBasisAreaSqft('LUMPSUM', areas)).toBeNull();
  });

  it('always shows both units so nobody converts mentally', () => {
    expect(formatAreaDual(1350, 'SQYD')).toBe('150 Sq.Yds (1,350 Sq.Ft)');
  });
});

describe('rule matching', () => {
  const unit: PricingUnitInput = {
    unit_type: 'FLAT',
    price_basis: 'SUPER_BUILT_UP',
    super_built_up_area_sqft: 1750,
    facing: 'EAST',
    floor: 5,
    bhk: '3 BHK',
    is_corner: false,
    is_park_facing: true,
  };

  it('treats null conditions as wildcards', () => {
    expect(
      ruleMatchesUnit(
        rule({
          id: 1,
          label: 'x',
          kind: 'CHARGE',
          category: 'OTHER',
          calc_method: 'FIXED',
          rate: 1,
        }),
        unit,
      ),
    ).toBe(true);
  });

  it('matches on facing, case-insensitively', () => {
    const east = rule({
      id: 1,
      label: 'East',
      kind: 'PREMIUM',
      category: 'FACING',
      calc_method: 'FIXED',
      rate: 1,
      match_facing: 'east',
    });
    const west = rule({
      id: 2,
      label: 'West',
      kind: 'PREMIUM',
      category: 'FACING',
      calc_method: 'FIXED',
      rate: 1,
      match_facing: 'WEST',
    });
    expect(ruleMatchesUnit(east, unit)).toBe(true);
    expect(ruleMatchesUnit(west, unit)).toBe(false);
  });

  it('matches a floor range inclusively', () => {
    const fifthUp = rule({
      id: 1,
      label: '5+',
      kind: 'PREMIUM',
      category: 'FLOOR',
      calc_method: 'FIXED',
      rate: 1,
      match_floor_min: 5,
    });
    const groundOnly = rule({
      id: 2,
      label: 'G',
      kind: 'PREMIUM',
      category: 'FLOOR',
      calc_method: 'FIXED',
      rate: 1,
      match_floor_max: 0,
    });
    expect(ruleMatchesUnit(fifthUp, unit)).toBe(true);
    expect(ruleMatchesUnit(groundOnly, unit)).toBe(false);
  });

  it('distinguishes an explicit false from a wildcard on booleans', () => {
    const cornerOnly = rule({
      id: 1,
      label: 'Corner',
      kind: 'PREMIUM',
      category: 'CORNER',
      calc_method: 'FIXED',
      rate: 1,
      match_corner: true,
    });
    const nonCornerOnly = rule({
      id: 2,
      label: 'Non-corner',
      kind: 'PREMIUM',
      category: 'CORNER',
      calc_method: 'FIXED',
      rate: 1,
      match_corner: false,
    });
    expect(ruleMatchesUnit(cornerOnly, unit)).toBe(false);
    expect(ruleMatchesUnit(nonCornerOnly, unit)).toBe(true);
  });

  it('only applies an optional rule when it is selected for that unit', () => {
    const optional = rule({
      id: 7,
      label: 'Club',
      kind: 'CHARGE',
      category: 'CLUB',
      calc_method: 'FIXED',
      rate: 100000,
      is_mandatory: false,
    });
    expect(ruleMatchesUnit(optional, unit)).toBe(false);
    expect(ruleMatchesUnit(optional, { ...unit, selected_optional_rule_ids: [7] })).toBe(true);
  });

  it('scopes rules to a unit type', () => {
    const plotOnly = rule({
      id: 1,
      label: 'Plot',
      kind: 'PREMIUM',
      category: 'OTHER',
      calc_method: 'FIXED',
      rate: 1,
      applies_to_unit_type: 'PLOT',
    });
    expect(ruleMatchesUnit(plotOnly, unit)).toBe(false);
    expect(ruleMatchesUnit(plotOnly, { ...unit, unit_type: 'PLOT' })).toBe(true);
  });
});

describe('spec example: Plot 001 (per-sq.yd rates)', () => {
  // projects (1).md - "PLOT PRICE": 150 Sq.Yds at Rs.20,000/sq.yd, with
  // east-facing, corner and 40ft-road premiums all charged per sq.yd, then
  // three fixed charges. Expected: Rs.36,75,000 then Rs.38,50,000.
  const plot: PricingUnitInput = {
    unit_type: 'PLOT',
    price_basis: 'PLOT_AREA',
    plot_area_sqyd: 150,
    area_sqft: 1350,
    facing: 'EAST',
    is_corner: true,
    is_road_facing: true,
  };

  const rules: PricingRule[] = [
    rule({
      id: 1,
      label: 'Base Rate',
      kind: 'BASE_RATE',
      category: 'OTHER',
      calc_method: 'PER_SQYD',
      rate: 20000,
      area_basis: 'PLOT_AREA',
      sort_order: 0,
    }),
    rule({
      id: 2,
      label: 'East Facing Premium',
      kind: 'PREMIUM',
      category: 'FACING',
      calc_method: 'PER_SQYD',
      rate: 1500,
      area_basis: 'PLOT_AREA',
      match_facing: 'EAST',
      sort_order: 1,
    }),
    rule({
      id: 3,
      label: 'Corner Premium',
      kind: 'PREMIUM',
      category: 'CORNER',
      calc_method: 'PER_SQYD',
      rate: 2000,
      area_basis: 'PLOT_AREA',
      match_corner: true,
      sort_order: 2,
    }),
    rule({
      id: 4,
      label: '40ft Road Premium',
      kind: 'PREMIUM',
      category: 'ROAD',
      calc_method: 'PER_SQYD',
      rate: 1000,
      area_basis: 'PLOT_AREA',
      match_road_facing: true,
      sort_order: 3,
    }),
    rule({
      id: 5,
      label: 'Club House',
      kind: 'CHARGE',
      category: 'CLUB',
      calc_method: 'FIXED',
      rate: 100000,
      sort_order: 4,
    }),
    rule({
      id: 6,
      label: 'Documentation',
      kind: 'CHARGE',
      category: 'LEGAL',
      calc_method: 'FIXED',
      rate: 25000,
      sort_order: 5,
    }),
    rule({
      id: 7,
      label: 'Maintenance',
      kind: 'CHARGE',
      category: 'MAINTENANCE',
      calc_method: 'FIXED',
      rate: 50000,
      sort_order: 6,
    }),
  ];

  const result = computePrice(plot, rules);

  it('computes the base price as rate x plot area', () => {
    expect(result.base_price).toBe(3000000); // 150 x 20,000
  });

  it('charges each premium per sq.yd', () => {
    const byLabel = Object.fromEntries(result.lines.map((l) => [l.label, l.amount]));
    expect(byLabel['East Facing Premium']).toBe(225000); // 150 x 1,500
    expect(byLabel['Corner Premium']).toBe(300000); // 150 x 2,000
    expect(byLabel['40ft Road Premium']).toBe(150000); // 150 x 1,000
    expect(result.premiums_total).toBe(675000);
  });

  it('reaches the spec total of Rs.36,75,000 before additional charges', () => {
    expect(result.base_price + result.premiums_total).toBe(3675000);
  });

  it('reaches the spec final amount of Rs.38,50,000', () => {
    expect(result.charges_total).toBe(175000); // 1,00,000 + 25,000 + 50,000
    expect(result.calculated_price).toBe(3850000);
  });

  it('does not apply a premium whose condition the plot fails', () => {
    const northFacing = computePrice({ ...plot, facing: 'NORTH' }, rules);
    expect(northFacing.lines.some((l) => l.label === 'East Facing Premium')).toBe(false);
    expect(northFacing.calculated_price).toBe(3850000 - 225000);
  });
});

describe('spec example: Flat A-503 (fixed premiums)', () => {
  // projects (1).md - "FLAT PRICE": base Rs.75,00,000 plus five fixed premiums
  // and charges. Expected final: Rs.84,25,000.
  const flat: PricingUnitInput = {
    unit_type: 'FLAT',
    price_basis: 'SUPER_BUILT_UP',
    super_built_up_area_sqft: 1750,
    carpet_area_sqft: 1250,
    built_up_area_sqft: 1450,
    facing: 'EAST',
    floor: 5,
    bhk: '3 BHK',
    view: 'GARDEN',
    is_park_facing: true,
    parking_count: 2,
    base_price_override: 7500000,
  };

  const rules: PricingRule[] = [
    rule({
      id: 1,
      label: '5th Floor Premium',
      kind: 'PREMIUM',
      category: 'FLOOR',
      calc_method: 'FIXED',
      rate: 200000,
      match_floor_min: 5,
      match_floor_max: 5,
      sort_order: 1,
    }),
    rule({
      id: 2,
      label: 'East Facing Premium',
      kind: 'PREMIUM',
      category: 'FACING',
      calc_method: 'FIXED',
      rate: 150000,
      match_facing: 'EAST',
      sort_order: 2,
    }),
    rule({
      id: 3,
      label: 'Park Facing Premium',
      kind: 'PREMIUM',
      category: 'PARK',
      calc_method: 'FIXED',
      rate: 100000,
      match_park_facing: true,
      sort_order: 3,
    }),
    rule({
      id: 4,
      label: 'Premium View',
      kind: 'PREMIUM',
      category: 'VIEW',
      calc_method: 'FIXED',
      rate: 75000,
      match_view: 'GARDEN',
      sort_order: 4,
    }),
    rule({
      id: 5,
      label: 'Parking',
      kind: 'CHARGE',
      category: 'PARKING',
      calc_method: 'QTY_X_RATE',
      rate: 150000,
      sort_order: 5,
    }),
    rule({
      id: 6,
      label: 'Club House',
      kind: 'CHARGE',
      category: 'CLUB',
      calc_method: 'FIXED',
      rate: 100000,
      sort_order: 6,
    }),
  ];

  const result = computePrice(flat, rules);

  it('reaches the spec final price of Rs.84,25,000', () => {
    expect(result.base_price).toBe(7500000);
    expect(result.premiums_total).toBe(525000); // 2,00,000 + 1,50,000 + 1,00,000 + 75,000
    expect(result.charges_total).toBe(400000); // 2 x 1,50,000 parking + 1,00,000 club
    expect(result.calculated_price).toBe(8425000);
  });

  it('prices parking as quantity x rate', () => {
    const parking = result.lines.find((l) => l.label === 'Parking')!;
    expect(parking.quantity).toBe(2);
    expect(parking.amount).toBe(300000);
  });

  it('gives a ground-floor flat no floor premium', () => {
    const ground = computePrice({ ...flat, floor: 0 }, rules);
    expect(ground.lines.some((l) => l.label === '5th Floor Premium')).toBe(false);
    expect(ground.calculated_price).toBe(8425000 - 200000);
  });
});

describe('base price from a rate, not a lump sum', () => {
  it('multiplies the per-sqft rate by the super built-up area', () => {
    // Spec's cost-sheet screen: 1,750 Sq.Ft x Rs.4,285
    const result = computePrice(
      { unit_type: 'FLAT', price_basis: 'SUPER_BUILT_UP', super_built_up_area_sqft: 1750 },
      [
        rule({
          id: 1,
          label: 'Base Rate',
          kind: 'BASE_RATE',
          category: 'OTHER',
          calc_method: 'PER_SQFT',
          rate: 4285,
        }),
      ],
    );
    expect(result.base_price).toBe(7498750);
    const line = result.lines[0];
    expect(line.quantity).toBe(1750);
    expect(line.rate).toBe(4285);
    expect(line.area_basis).toBe('SUPER_BUILT_UP');
  });

  it('honours a per-unit base rate over the project rule', () => {
    const result = computePrice(
      {
        unit_type: 'FLAT',
        price_basis: 'SUPER_BUILT_UP',
        super_built_up_area_sqft: 1000,
        base_rate: 5000,
        base_rate_unit: 'PER_SQFT',
      },
      [
        rule({
          id: 1,
          label: 'Base Rate',
          kind: 'BASE_RATE',
          category: 'OTHER',
          calc_method: 'PER_SQFT',
          rate: 4000,
        }),
      ],
    );
    expect(result.base_price).toBe(5000000);
  });

  it('warns instead of silently pricing at zero when no rate is configured', () => {
    const result = computePrice(
      { unit_type: 'PLOT', price_basis: 'PLOT_AREA', plot_area_sqyd: 100 },
      [],
    );
    expect(result.base_price).toBe(0);
    expect(result.warnings.join(' ')).toMatch(/no base rate/i);
  });

  it('warns when a per-area rule has no area to multiply', () => {
    const result = computePrice({ unit_type: 'FLAT', price_basis: 'CARPET' }, [
      rule({
        id: 1,
        label: 'Base Rate',
        kind: 'BASE_RATE',
        category: 'OTHER',
        calc_method: 'PER_SQFT',
        rate: 4000,
      }),
    ]);
    expect(result.base_price).toBe(0);
    expect(result.warnings.join(' ')).toMatch(/CARPET area/);
  });
});

describe('percentages, taxes, discounts and overrides', () => {
  const base = [
    rule({
      id: 1,
      label: 'Base Rate',
      kind: 'BASE_RATE',
      category: 'OTHER',
      calc_method: 'FIXED',
      rate: 10000000,
    }),
  ];

  it('computes a percentage rule against the base price', () => {
    const result = computePrice({ unit_type: 'FLAT', price_basis: 'LUMPSUM' }, [
      ...base,
      rule({
        id: 2,
        label: 'Infrastructure',
        kind: 'CHARGE',
        category: 'INFRA',
        calc_method: 'PERCENT_OF_BASE',
        rate: 2,
      }),
    ]);
    expect(result.charges_total).toBe(200000); // 2% of 1 Cr
  });

  it('keeps tax out of the calculated price and reports it separately', () => {
    const result = computePrice({ unit_type: 'FLAT', price_basis: 'LUMPSUM' }, [
      ...base,
      rule({
        id: 2,
        label: 'GST',
        kind: 'TAX',
        category: 'TAX',
        calc_method: 'PERCENT_OF_BASE',
        rate: 5,
        is_tax: true,
      }),
    ]);
    expect(result.calculated_price).toBe(10000000);
    expect(result.taxes_total).toBe(500000);
    expect(result.all_inclusive_price).toBe(10500000);
  });

  it('reports refundable deposits without excluding them from the total', () => {
    const result = computePrice({ unit_type: 'FLAT', price_basis: 'LUMPSUM' }, [
      ...base,
      rule({
        id: 2,
        label: 'IFMS',
        kind: 'CHARGE',
        category: 'MAINTENANCE',
        calc_method: 'FIXED',
        rate: 150000,
        is_refundable: true,
      }),
    ]);
    expect(result.refundable_total).toBe(150000);
    expect(result.calculated_price).toBe(10150000);
  });

  it('subtracts a discount and warns if it swallows the price', () => {
    const ok = computePrice(
      { unit_type: 'FLAT', price_basis: 'LUMPSUM', discount_amount: 150000 },
      base,
    );
    expect(ok.calculated_price).toBe(9850000);

    const silly = computePrice(
      { unit_type: 'FLAT', price_basis: 'LUMPSUM', discount_amount: 20000000 },
      base,
    );
    expect(silly.warnings.join(' ')).toMatch(/discount exceeds/i);
  });

  it('adds hand-written lines to the sheet', () => {
    const result = computePrice(
      {
        unit_type: 'FLAT',
        price_basis: 'LUMPSUM',
        manual_lines: [{ label: 'Negotiated corner adjustment', amount: 75000 }],
      },
      base,
    );
    expect(result.charges_total).toBe(75000);
    expect(
      result.lines.find((l) => l.is_manual && l.label === 'Negotiated corner adjustment'),
    ).toBeTruthy();
  });

  it('preserves the calculated price when a manual override is set', () => {
    // Spec section 20: the system must keep both figures, never overwrite.
    const result = computePrice({ unit_type: 'FLAT', price_basis: 'LUMPSUM' }, base);
    expect(result.calculated_price).toBe(10000000);
    expect(resolveFinalPrice(result.calculated_price, 10200000)).toBe(10200000);
    expect(resolveFinalPrice(result.calculated_price, null)).toBe(10000000);
  });
});

describe('the cost sheet reconciles', () => {
  it('always sums its own line items to the calculated price', () => {
    const unit: PricingUnitInput = {
      unit_type: 'PLOT',
      price_basis: 'PLOT_AREA',
      plot_area_sqyd: 200,
      facing: 'NORTH_EAST',
      is_corner: true,
      discount_amount: 50000,
    };
    const rules: PricingRule[] = [
      rule({
        id: 1,
        label: 'Base Rate',
        kind: 'BASE_RATE',
        category: 'OTHER',
        calc_method: 'PER_SQYD',
        rate: 22000,
        area_basis: 'PLOT_AREA',
      }),
      rule({
        id: 2,
        label: 'NE Facing',
        kind: 'PREMIUM',
        category: 'FACING',
        calc_method: 'PER_SQYD',
        rate: 2000,
        area_basis: 'PLOT_AREA',
        match_facing: 'NORTH_EAST',
      }),
      rule({
        id: 3,
        label: 'Corner',
        kind: 'PREMIUM',
        category: 'CORNER',
        calc_method: 'PERCENT_OF_BASE',
        rate: 3,
        match_corner: true,
      }),
      rule({
        id: 4,
        label: 'EDC',
        kind: 'CHARGE',
        category: 'INFRA',
        calc_method: 'PER_SQYD',
        rate: 500,
        area_basis: 'PLOT_AREA',
      }),
      rule({
        id: 5,
        label: 'GST',
        kind: 'TAX',
        category: 'TAX',
        calc_method: 'PERCENT_OF_BASE',
        rate: 5,
        is_tax: true,
      }),
    ];

    const r = computePrice(unit, rules);
    const summed = r.lines.filter((l) => l.kind !== 'TAX').reduce((acc, l) => acc + l.amount, 0);

    expect(Math.round(summed - r.discount_amount)).toBe(Math.round(r.calculated_price));
    expect(Math.round(r.calculated_price + r.taxes_total)).toBe(Math.round(r.all_inclusive_price));
  });
});
