type SafeAny = string | number | boolean | null | undefined | { [key: string]: SafeAny } | SafeAny[];
export interface LoginResponseData { [key: string]: SafeAny; }
