import * as alt from 'alt-server';

// -------------------------- Consum/Growth - Config --------------------------------
export const HANDLE_CONFIG = {
    // Tick Update Time:
    TICK_TIME: 5000,
    // Maximum fill Levels or Maximum Engine Mileage:
    MAX_FUEL: 100,
    MAX_OIL: 100,
    MAX_MILEAGE: 300000,
    MAX_ENGINE_HEALTH: 1000,
    // In Tick (lost or increase):
    FUEL_LOST: 2, // Best (0.1) The amount of fuel *lost* every TIME_BETWEEN_UPDATES
    ENGINE_HEALTH_LOST: 0.1, // Best (0.001)
    MILEAGE_GROWTH: 1.5, // Best (0.5) The amount of mileage *increase* per tick
    OIL_LOST: 1, // Best (0.01) The amount of oil *lost* every TIME_BETWEEN_UPDATES
    // New Car Setting (half):
    FUEL_CREATE: 50,
    OIL_CREATE: 50,
    MILEAGE_CREATE: 0,
    ENGINE_HEALTH_CREATE: 1000,
    POS_CREATE: { x: 0, y: 0, z: 0 },
    EMPTY: 0,
};
export const HANDLE_NAME = {
    FUEL: 'state.fuel',
    OIL: 'state.oil',
    MILEAGE: 'state.mileage',
    ENGINE_HEALTH: 'state.engineHealth',
};
//------------------------- Fuel Gasstation - Config --------------------------------
export const STATION_CONFIG = {
    FUEL_PRICE: 5,
    FUEL_RESET_TIMEOUT: 20000,
    FUEL_TIME: 200,
};
// Gasstation Progress
export const PROGRESSBAR = {
    COLOR: new alt.RGBA(255, 255, 255, 255),
    DISTANCE: 15,
};
//------------------------------------------------------------------------------------
// Extends the player interface.
declare module 'alt-server' {
    export interface Vehicle {
        lastPosition?: alt.IVector3;
        nextSave?: number;
    }
}
// extern Vehicle:
declare module 'alt-server' {
    export interface Vehicle {
        isRefueling?: boolean;
    }
}
// Distance:
export enum ATHENA_EVENTS_VEHICLE {
    DISTANCE_TRAVELED = 'athena:DistanceTraveled',
}
