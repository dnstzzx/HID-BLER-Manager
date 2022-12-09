import type { Ref } from "vue"

export enum Macro_Output_Model{
    MACRO_MODEL_MOUSE
}

export enum Macro_Action_Type{
    MACRO_ACTION_TYPE_ONCE, MACRO_ACTION_TYPE_KEEP, MACRO_ACRION_TYPE_TOGGLE
}

export class Mouse_Report{
    static readonly XYW_SCALE = 32767

    btns: number
    x: number       // percent value
    y: number       // percent value
    wheel: number   // percent value

    constructor(s: string){
        let buff = new Uint8Array(s.match(/../g)!.map(h=>parseInt(h,16)))
        this.btns = buff[1]
        let view = new DataView(buff.buffer, 2, 6);
        [this.x, this.y, this.wheel] = [0, 2, 4].map((offset)=>{
            let v = view.getInt16(offset, true)
            return v / Mouse_Report.XYW_SCALE
        })
    }
    get hex(){
        let h = '00'
        h += this.btns.toString(16).padStart(2, '0')
        h += [this.x, this.y, this.wheel].map((p)=>{
            let v = Math.round(p * Mouse_Report.XYW_SCALE) & 0xFFFF
            return ((v >> 8) | ((v & 0xFF) << 8)).toString(16).padStart(4, '0')
        }).join('')
        return h
    }
}

export interface Mouse_Macro{
    name: string
    version: number
    trigger_buttons_mask: number
    cancel_input_report: boolean
    output_model: Macro_Output_Model
    action_type: Macro_Action_Type
    action_delay: number
    report_duration: number
    mouse_output_report: string
}