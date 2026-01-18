/**
 * Unit tests for location simulation tool schemas
 */

import { describe, test, expect } from 'vitest';
import {
  SetLocationSchema,
  SimulateRouteSchema,
  ListLocationScenariosSchema,
  ClearLocationSchema
} from '../../src/schemas/location.js';

describe('SetLocationSchema', () => {
  test('accepts valid location coordinates', () => {
    const input = {
      latitude: 37.7749,
      longitude: -122.4194
    };

    const result = SetLocationSchema.parse(input);

    expect(result.latitude).toBe(37.7749);
    expect(result.longitude).toBe(-122.4194);
    expect(result.device).toBe('booted');
  });

  test('accepts custom device', () => {
    const result = SetLocationSchema.parse({
      device: 'ABC123',
      latitude: 40.7128,
      longitude: -74.0060
    });

    expect(result.device).toBe('ABC123');
  });

  test('validates latitude range', () => {
    expect(() => SetLocationSchema.parse({
      latitude: -91,
      longitude: 0
    })).toThrow();

    expect(() => SetLocationSchema.parse({
      latitude: 91,
      longitude: 0
    })).toThrow();

    const result = SetLocationSchema.parse({
      latitude: -90,
      longitude: 0
    });
    expect(result.latitude).toBe(-90);

    const result2 = SetLocationSchema.parse({
      latitude: 90,
      longitude: 0
    });
    expect(result2.latitude).toBe(90);
  });

  test('validates longitude range', () => {
    expect(() => SetLocationSchema.parse({
      latitude: 0,
      longitude: -181
    })).toThrow();

    expect(() => SetLocationSchema.parse({
      latitude: 0,
      longitude: 181
    })).toThrow();

    const result = SetLocationSchema.parse({
      latitude: 0,
      longitude: -180
    });
    expect(result.longitude).toBe(-180);

    const result2 = SetLocationSchema.parse({
      latitude: 0,
      longitude: 180
    });
    expect(result2.longitude).toBe(180);
  });

  test('requires latitude and longitude', () => {
    expect(() => SetLocationSchema.parse({})).toThrow();
    expect(() => SetLocationSchema.parse({ latitude: 0 })).toThrow();
    expect(() => SetLocationSchema.parse({ longitude: 0 })).toThrow();
  });
});

describe('SimulateRouteSchema', () => {
  test('accepts valid route with minimum waypoints', () => {
    const input = {
      waypoints: [
        { latitude: 37.7749, longitude: -122.4194 },
        { latitude: 40.7128, longitude: -74.0060 }
      ]
    };

    const result = SimulateRouteSchema.parse(input);

    expect(result.waypoints).toHaveLength(2);
    expect(result.speed).toBe(20);
    expect(result.device).toBe('booted');
  });

  test('accepts route with multiple waypoints', () => {
    const input = {
      waypoints: [
        { latitude: 37.7749, longitude: -122.4194 },
        { latitude: 39.9526, longitude: -75.1652 },
        { latitude: 40.7128, longitude: -74.0060 }
      ]
    };

    const result = SimulateRouteSchema.parse(input);

    expect(result.waypoints).toHaveLength(3);
  });

  test('accepts custom speed', () => {
    const result = SimulateRouteSchema.parse({
      waypoints: [
        { latitude: 0, longitude: 0 },
        { latitude: 1, longitude: 1 }
      ],
      speed: 50
    });

    expect(result.speed).toBe(50);
  });

  test('accepts optional update interval and distance', () => {
    const result = SimulateRouteSchema.parse({
      waypoints: [
        { latitude: 0, longitude: 0 },
        { latitude: 1, longitude: 1 }
      ],
      updateInterval: 2.5,
      updateDistance: 1000
    });

    expect(result.updateInterval).toBe(2.5);
    expect(result.updateDistance).toBe(1000);
  });

  test('requires minimum 2 waypoints', () => {
    expect(() => SimulateRouteSchema.parse({
      waypoints: []
    })).toThrow();

    expect(() => SimulateRouteSchema.parse({
      waypoints: [{ latitude: 0, longitude: 0 }]
    })).toThrow();
  });

  test('validates waypoint coordinates', () => {
    expect(() => SimulateRouteSchema.parse({
      waypoints: [
        { latitude: 91, longitude: 0 },
        { latitude: 0, longitude: 0 }
      ]
    })).toThrow();

    expect(() => SimulateRouteSchema.parse({
      waypoints: [
        { latitude: 0, longitude: 181 },
        { latitude: 0, longitude: 0 }
      ]
    })).toThrow();
  });

  test('validates speed is positive', () => {
    expect(() => SimulateRouteSchema.parse({
      waypoints: [
        { latitude: 0, longitude: 0 },
        { latitude: 1, longitude: 1 }
      ],
      speed: -10
    })).toThrow();

    expect(() => SimulateRouteSchema.parse({
      waypoints: [
        { latitude: 0, longitude: 0 },
        { latitude: 1, longitude: 1 }
      ],
      speed: 0
    })).toThrow();
  });
});

describe('ListLocationScenariosSchema', () => {
  test('accepts device parameter', () => {
    const result = ListLocationScenariosSchema.parse({ device: 'ABC123' });
    expect(result.device).toBe('ABC123');
  });

  test('defaults to booted', () => {
    const result = ListLocationScenariosSchema.parse({});
    expect(result.device).toBe('booted');
  });
});

describe('ClearLocationSchema', () => {
  test('accepts device parameter', () => {
    const result = ClearLocationSchema.parse({ device: 'ABC123' });
    expect(result.device).toBe('ABC123');
  });

  test('defaults to booted', () => {
    const result = ClearLocationSchema.parse({});
    expect(result.device).toBe('booted');
  });
});
