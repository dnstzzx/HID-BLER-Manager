import 'element-plus/es/components/message/style/css'
import { ElMessageBox } from 'element-plus'

const msg_request_length = 128;
const msg_short_report_id = 3;
const msg_short_length = 128;

const msg_long_report_id = 4;
const msg_long_block_length = 512;
const msg_long_block_data_length = msg_long_block_length - 4;

interface Response_Info{
    success: boolean,
    reason: string,
    data:   string | object
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

export class Device{
    connected = false
    hid_divece: HIDDevice|undefined = undefined
    on_connected_listeners = [] as (()=>boolean)[]  // returns true if wants cancel the event
    on_disconnected_listeners  = [] as (()=>boolean)[]  // returns true if wants cancel the event
    on_device_output = ()=>{}
    receiving_long_msgs: Map<number, Long_Msg> = new Map()
    session_listeners: Map<number,(resp:Response_Info)=>void> = new Map()

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
                let info: Response_Info = {
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

    async send_request(opcode: number, data: string|object, timeout=0){
        let buff = new ArrayBuffer(128)
        let view = new DataView(buff)
        let session = 0
        do{
            session = Math.floor(Math.random() * 0xFFFF)
        }while(this.session_listeners.has(session))
        view.setUint16(0, opcode, true);    // opcode
        view.setUint16(2, session, true);         // session
        let dataview = new Uint8Array(buff, 6, msg_request_length - 6); // data
        let s = typeof(data) == 'string' ? data : JSON.stringify(data)
        let rst = new TextEncoder().encodeInto(s, dataview)
        if(rst.read != s.length || rst.written == undefined){
            return {
                success: false,
                reason: '消息长度超出编码限制', 
                data: {}
            } as Response_Info
        }
        view.setUint16(4, rst.written, true)    // length
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
        }) as Promise<Response_Info>
        await this.hid_divece?.sendReport(msg_short_report_id, buff)
        return await p
    }

    async get_device_info(){
        let r = await this.send_request(1, "", 3000)
        if(!r.success){
            ElMessageBox.alert(r.reason, '操作失败')
            return undefined
        }
        return r.data as Device_Info
    }

    async restart(download_mode:boolean){
        this.send_request(2, download_mode ? "1":"0")
    }

    async get_macros(){
        return await this.send_request(4, "")
    }
}

