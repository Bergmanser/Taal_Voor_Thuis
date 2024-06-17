import { Font, FontList, Options } from "@samuelmeuli/font-manager";
export default class FontPicker {
    private activeFontButton;
    private dropdownFamily;
    private expanded;
    private fontManager;
    private fontPickerDiv;
    private ul;
    constructor(apiKey: string, defaultFamily: string | undefined, { pickerId, families, categories, scripts, variants, filter, limit, sort, }: Partial<Options>, onChange?: (font: Font) => void);
    private generateUI;
    private generateFontList;
    private addFontLi;
    private closeEventListener;
    private toggleExpanded;
    getFonts(): FontList;
    addFont(fontFamily: string, index?: number): void;
    removeFont(fontFamily: string): void;
    getActiveFont(): Font;
    setActiveFont(fontFamily: string): void;
    setOnChange(onChange: (font: Font) => void): void;
}
//# sourceMappingURL=FontPicker.d.ts.map