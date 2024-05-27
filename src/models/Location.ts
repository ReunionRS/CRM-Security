export class Location {
    address: string;
    entryPointsAmount: number;
    exitPointsAmount: number;
    guardList: string;
    fio: string;
    state: 'active' | 'inactive' | 'emergency'


    constructor(address: string, entryPointsAmount: number, exitPointsAmount: number, guardList: string, fio: string, state: "active" | "inactive" | "emergency") {
        this.address = address;
        this.entryPointsAmount = entryPointsAmount;
        this.exitPointsAmount = exitPointsAmount;
        this.guardList = guardList;
        this.fio = fio;
        this.state = state;
    }
}
