import alt from 'alt-server';
import * as Athena from '@AthenaServer/api/index.js';
import { HANDLE_CONFIG} from './config.js';
import { IBaseVehicle } from '../../shared/interfaces/ibasevehicle.js';
import { VEHICLE_STATE } from '../../shared/vehicle.js';
import { System } from './system.js';
import { NotifyController } from '@AthenaPlugins/athena-plugin-notifications/server/controller.js';

let vehicle: alt.Vehicle;

Athena.commands.register('setoil', '/setoil [amount]', ['admin'], (player: alt.Player, amountInput: string) => {
    const amount: number = parseInt(amountInput);
    if (isNaN(amount) || amount < 0 || amount > HANDLE_CONFIG.MAX_OIL) {
        NotifyController.send(player, 3, 7, `Fahrzeugmeldung`,`Falscher Wert (0 bis 100).`);
        return;
    }
    if (!player.vehicle) {
        NotifyController.send(player, 3, 7, `Fahrzeugmeldung`,`Im Fahrzeug ausführen.`);
        return;
    }
    const vehicleData = Athena.document.vehicle.get<IBaseVehicle>(player.vehicle);
    if (!vehicleData) {
        NotifyController.send(player, 3, 7, `Fahrzeugmeldung`,'Fahrzeugdaten nicht gefunden oder ungültig.');
        return;
    }
    vehicleData.state.oil = amount;
    player.vehicle.setSyncedMeta(VEHICLE_STATE.OIL, vehicleData.state.oil);
    Athena.document.vehicle.set<IBaseVehicle>(player.vehicle, 'oil', vehicleData.state.oil);
    NotifyController.send(player, 11, 7, `Fahrzeugmeldung`, `Öl auf ${amount} Liter gesetzt.`);
    System.addDebugText_useCommands(vehicle, vehicleData);
});

Athena.commands.register('setfuel', '/setfuel [amount]', ['admin'], (player: alt.Player, amountInput: string) => {
    const amount: number = parseInt(amountInput);
    if (isNaN(amount) || amount < 0 || amount > HANDLE_CONFIG.MAX_FUEL) {
        NotifyController.send(player, 3, 7, `Fahrzeugmeldung`,`Falscher Wert (0 bis 100).`);
        return;
    }
    if (!player.vehicle) {
        NotifyController.send(player, 3, 7, `Fahrzeugmeldung`,`Im Fahrzeug ausführen.`);
        return;
    }
    const vehicleData = Athena.document.vehicle.get<IBaseVehicle>(player.vehicle);
    if (!vehicleData) {
        NotifyController.send(player, 3, 7, `Fahrzeugmeldung`,'Fahrzeugdaten nicht gefunden oder ungültig.');
        return;
    }
    vehicleData.state.fuel = amount;
    player.vehicle.setSyncedMeta(VEHICLE_STATE.FUEL, vehicleData.state.fuel);
    Athena.document.vehicle.set<IBaseVehicle>(player.vehicle, 'fuel', vehicleData.state.fuel);
    NotifyController.send(player, 10, 7, `Fahrzeugmeldung`, `Benzin auf ${amount} Liter gesetzt`);
    System.addDebugText_useCommands(vehicle, vehicleData);
});

Athena.commands.register('setmileage', '/setmileage [amount]', ['admin'], (player: alt.Player, amountInput: string) => {
    const amount: number = parseInt(amountInput);
    if (isNaN(amount) || amount < 0 || amount >= HANDLE_CONFIG.MAX_MILEAGE) {
        NotifyController.send(player, 3, 7, `Fahrzeugmeldung`,`Falscher Wert (0 bis 300000).`);
        return;
    }
    if (!player.vehicle) {
        NotifyController.send(player, 3, 7, `Fahrzeugmeldung`,`Im Fahrzeug ausführen.`);
        return;
    }
    const vehicleData = Athena.document.vehicle.get<IBaseVehicle>(player.vehicle);
    if (!vehicleData) {
        NotifyController.send(player, 3, 7, `Fahrzeugmeldung`,'Fahrzeugdaten nicht gefunden oder ungültig.');
        return;
    }
    vehicleData.state.mileage = amount;
    player.vehicle.setSyncedMeta(VEHICLE_STATE.MILEAGE, vehicleData.state.mileage);
    Athena.document.vehicle.set<IBaseVehicle>(player.vehicle, 'mileage', vehicleData.state.mileage);
    NotifyController.send(player, 11, 7, `Fahrzeugmeldung`, `Kilometerstand auf ${amount} Km gesetzt`);
    System.addDebugText_useCommands(vehicle, vehicleData);
});

Athena.commands.register('setenginehealth', '/setenginehealth [amount]', ['admin'], (player: alt.Player, amountInput: string) => {
    const amount: number = parseInt(amountInput);
    if (isNaN(amount) || amount < 0 || amount > HANDLE_CONFIG.MAX_ENGINE_HEALTH) {
        NotifyController.send(player, 3, 7, `Fahrzeugmeldung`,`Falscher Wert (0 bis 100).`);
        return;
    }
    if (!player.vehicle) {
        NotifyController.send(player, 3, 7, `Fahrzeugmeldung`,`Im Fahrzeug ausführen.`);
        return;
    }
    const vehicleData = Athena.document.vehicle.get<IBaseVehicle>(player.vehicle);
    if (!vehicleData) {
        NotifyController.send(player, 3, 7, `Fahrzeugmeldung`,'Fahrzeugdaten nicht gefunden oder ungültig.');
        return;
    }
    vehicleData.state.engineHealth = amount;
    player.vehicle.setSyncedMeta(VEHICLE_STATE.ENGINE_HEALTH, vehicleData.state.engineHealth);
    Athena.document.vehicle.set<IBaseVehicle>(player.vehicle, 'engineHealth', vehicleData.state.engineHealth);
    NotifyController.send(player, 11, 7, `Fahrzeugmeldung`, `Motorzustand auf ${amount}% gesetzt.`);
    System.addDebugText_useCommands(vehicle, vehicleData);
});

