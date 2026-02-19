export class Form {
    address: string | null = null;
    passport: string | null = null;
    fioAddress: string | null = null;
    fio: string | null = null;
    note: string | null = null;
    price: number | null = null;
    state: 'open' | 'close' = 'open'


    constructor(address: string | null, passport: string | null, fioAddress: string | null, fio: string | null, note: string | null, price: number | null) {
        this.address = address;
        this.passport = passport;
        this.fioAddress = fioAddress;
        this.fio = fio;
        this.note = note;
        this.price = price;
    }
}
