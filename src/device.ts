import 'element-plus/es/components/message/style/css'
import { ElMessageBox } from 'element-plus'
import type { Mouse_Macro } from './pages/page_macros/macro_types';

const msg_request_length = 128;
const msg_short_report_id = 3;
const msg_short_length = 128;

const msg_long_report_id = 4;
const msg_long_block_length = 512;
const msg_long_block_data_length = msg_long_block_length - 4;

interface Response_Info<T extends string | object>{
    success: boolean,
    reason: string,
    data:   T
}

export interface Device_Info{
    battery_voltage: number,
    slots: {
        id: number,
        mode: number
    }[]
}

interface Long_Msg{
    session: number,
    block_count: number,
    transfered_blocks: number,
    data: Uint8Array
}

export function handle_error_resp(resp: Response_Info<any>, fail_title="操作失败"){
    if(!resp.success)   ElMessageBox.alert(resp.reason, fail_title)
    return resp.success
}

export class Device{
    connected = false
    hid_divece: HIDDevice|undefined = undefined
    on_connected_listeners = [] as (()=>boolean)[]  // returns true if wants cancel the event
    on_disconnected_listeners  = [] as (()=>boolean)[]  // returns true if wants cancel the event
    on_device_output = ()=>{}
    receiving_long_msgs: Map<number, Long_Msg> = new Map()
    session_listeners: Map<number,(resp:Response_Info<any>)=>void> = new Map()

    async connect(vid:number, pid: number){
        let devices = await navigator.hid.requestDevice({filters:[{
            vendorId: vid,
            productId: pid,
            usagePage: 0xff01
        }]})
        if(devices.length == 0){
            ElMessageBox.alert('未选择任何有效设备', '连接失败')
            return false
        }else if(devices.length > 1){
            ElMessageBox.alert('只能选择一个设备', '连接失败')
            return false
        }

        let device = devices[0]
        await device.open()
        if(!device.opened){
            ElMessageBox.alert('无法打开设备', '连接失败')
            return false
        }

        this.hid_divece = device
        this.connected = true
        navigator.hid.addEventListener("disconnect", (evt) =>{
            if(evt.device == device){
                this.connected = false
                for(let listener of this.on_disconnected_listeners){
                    if(listener())  break
                }
                ElMessageBox.alert('连接已断开', '连接断开')
            }
        })


        let handle_msg = (buff: DataView)=>{
            let session = buff.getUint16(0, true)   // session
            let length = buff.getUint16(2, true)   // length
            let success = buff.getUint8(4)         // success
            
            if(this.session_listeners.has(session)){
                let s = new TextDecoder().decode(new DataView(buff.buffer, 5 + buff.byteOffset, length))
                let info: Response_Info<any> = {
                    success: success != 0,
                    reason: success == 0 ? s : '',
                    data: success == 0 ? {} : s.startsWith('{') ? JSON.parse(s): s
                }
                this.session_listeners.get(session)!(info)
            }
        }
        this.hid_divece.oninputreport= (ev)=>{
            if(ev.reportId == msg_short_report_id){
                handle_msg(ev.data)
            }else if(ev.reportId == msg_long_report_id){
                let buff = ev.data
                let session = buff.getUint16(0, true)   // session
                let blk_count = buff.getUint8(2)   // blk_count
                let blk_id = buff.getUint8(3)         // blk_id
                let msg: Long_Msg
                if(!this.receiving_long_msgs.has(session)){
                    msg = {
                        session: session,
                        block_count: blk_count,
                        transfered_blocks: (1 << blk_count) - 1,
                        data: new Uint8Array(blk_count * msg_long_block_data_length)
                    }
                    this.receiving_long_msgs.set(session, msg)
                }else{
                    msg = this.receiving_long_msgs.get(session)!
                }
                let blk_data = new Uint8Array(buff.buffer, buff.byteOffset + 4)
                msg.data.set(blk_data, blk_id * msg_long_block_data_length)
                msg.transfered_blocks -= 1 << blk_id
                if(msg.transfered_blocks == 0){
                    this.receiving_long_msgs.delete(session)
                    handle_msg(new DataView(msg.data.buffer))
                }

            }
        }
        for(let listener of this.on_connected_listeners){
            if(listener())  break
        }
        return true
    }

    async _snd_msg_short(buff: ArrayBuffer){
        return await this.hid_divece?.sendReport(msg_short_report_id, buff)
    }

    async _snd_msg_long(buff: ArrayBuffer, session: number){
        let blk = new Uint8Array(msg_long_block_length)
        let blk_cnt = Math.ceil(buff.byteLength/msg_long_block_data_length)
        for(let i=0;i<blk_cnt;i++){
            blk[0] = session & 0xFF    // session low
            blk[1] = session >> 8      // session high
            blk[2] = blk_cnt           // blk_count
            blk[3] = i                 // blk_id
            let blk_data = new Uint8Array(buff, i * msg_long_block_data_length, msg_long_block_data_length)
            blk.set(blk_data, 4)
            await this.hid_divece?.sendReport(msg_long_report_id, blk) 
        }
    }

    async send_request(opcode: number, data: string|object, timeout=0){
        let session = 0
        do{
            session = Math.floor(Math.random() * 0xFFFF)
        }while(this.session_listeners.has(session) || session == 0)
        let s = typeof(data) == 'string' ? data : JSON.stringify(data)
        let data_length = new TextEncoder().encode(s).length
        let msg_length = data_length <= msg_short_length - 6 ? msg_short_length : Math.ceil((data_length + 6) / msg_long_block_data_length) * msg_long_block_data_length
        let buff = new ArrayBuffer(msg_length)
        let view = new DataView(buff)
        view.setUint16(0, opcode, true);        // opcode
        view.setUint16(2, session, true);       // session
        view.setUint16(4, data_length, true)    // length
        let dataview = new Uint8Array(buff, 6); // data
        new TextEncoder().encodeInto(s, dataview)

        let p = new Promise((resolve, reject) =>{
            let resolved = false
            this.session_listeners.set(session, (resp)=>{
                resolved = true
                this.session_listeners.delete(session)
                resolve(resp)
            })
            if(timeout != 0){
                setTimeout(()=>{
                    if(!resolved){
                        this.session_listeners.delete(session)
                        resolve({
                            success: false,
                            reason: '请求超时',
                            data: {}
                        })
                    }
                }, timeout)
            }
        }) as Promise<Response_Info<any>>
        await msg_length == msg_short_length ? this._snd_msg_short(buff) : this._snd_msg_long(buff, session)
        return await p
    }

    async get_device_info(timeout=3000){
        return await this.send_request(1, "", timeout) as Response_Info<Device_Info>
    }
    
    async restart(download_mode:boolean, timeout=3000){
        await this.send_request(2, download_mode ? "1":"0", timeout)
    }
    
    async get_macros(timeout=6000){
        return await this.send_request(4, "", timeout) as Response_Info<{mouse: Mouse_Macro[]}>
    }
    
    async set_macro(macros: {type:string, mouse: Mouse_Macro}, timeout=5000){
        return await this.send_request(5, macros, timeout) as Response_Info<string>
    }
    
    async remove_macro(name: string, timeout=3000){
        return await this.send_request(6, name, timeout) as Response_Info<string>
    }
    

}

