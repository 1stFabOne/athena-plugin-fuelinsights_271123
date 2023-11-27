import alt from 'alt-server';
import { Vehicle_Behavior } from '../vehicle.js';
import { JobTrigger } from '@AthenaShared/interfaces/jobTrigger.js';
import { VEHICLE_CLASS, VEHICLE_TYPE } from '@AthenaShared/enums/vehicleTypeFlags.js';

export interface IBaseVehicle {

    _id?: unknown;
    id?: number;
    owner: string | null;
    model: string;
    class: VEHICLE_CLASS;
    type: VEHICLE_TYPE;
    mass: number;
    fuel: number;
    oil: number;
    mileage: number;
    engineHealth: number;
    plate: string;
    faction?: string;
    state?: Partial<IBaseVehicle> | IBaseVehicle;
    pos: alt.IVector3;
    rot: alt.IVector3;
    dimension: number;
    keys: Array<string>;
    permissions: Array<string>;
    garageInfo?: number | null;
    doNotDespawn?: boolean;
    lastUsed?: number;
    groups?: { [key: string]: Array<string> };
    behavior?: Vehicle_Behavior;
    vehicle: alt.Player;
};

export interface EngineStop {
    vehicle: alt.Vehicle, 
    value: number, 
    minValue: number,
    maxValue: number,
};

export interface Fuelcosts {
    fuel: number;
    cost: number;
    timeout: number;
    vehicle: alt.Vehicle;
};
// Gasstation:
export const fuelInfo: { [playerID: string]: Fuelcosts } = {};
// Gasstation:
export const LastTriggers: { [id: string]: JobTrigger } = {};
// Gasstation:
export const maximumFuel = 100;
