let wasm;

const heap = new Array(128).fill(void 0);

heap.push(void 0, null, !0, !1);

let heap_next = heap.length;

function addHeapObject(obj) {
    heap_next === heap.length && heap.push(heap.length + 1);
    const idx = heap_next;
    return heap_next = heap[idx], heap[idx] = obj, idx;
}

function getObject(idx) {
    return heap[idx];
}

function takeObject(idx) {
    const ret = getObject(idx);
    return function(idx) {
        idx < 132 || (heap[idx] = heap_next, heap_next = idx);
    }(idx), ret;
}

const cachedTextDecoder = "undefined" != typeof TextDecoder ? new TextDecoder("utf-8", {
    ignoreBOM: !0,
    fatal: !0
}) : {
    decode: () => {
        throw Error("TextDecoder not available");
    }
};

"undefined" != typeof TextDecoder && cachedTextDecoder.decode();

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    return null !== cachedUint8ArrayMemory0 && 0 !== cachedUint8ArrayMemory0.byteLength || (cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer)), 
    cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    return ptr >>>= 0, cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = "undefined" != typeof TextEncoder ? new TextEncoder("utf-8") : {
    encode: () => {
        throw Error("TextEncoder not available");
    }
}, encodeString = "function" == typeof cachedTextEncoder.encodeInto ? function(arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
} : function(arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    return view.set(buf), {
        read: arg.length,
        written: buf.length
    };
};

function passStringToWasm0(arg, malloc, realloc) {
    if (void 0 === realloc) {
        const buf = cachedTextEncoder.encode(arg), ptr = malloc(buf.length, 1) >>> 0;
        return getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf), WASM_VECTOR_LEN = buf.length, 
        ptr;
    }
    let len = arg.length, ptr = malloc(len, 1) >>> 0;
    const mem = getUint8ArrayMemory0();
    let offset = 0;
    for (;offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 127) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        0 !== offset && (arg = arg.slice(offset)), ptr = realloc(ptr, len, len = offset + 3 * arg.length, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        offset += encodeString(arg, view).written, ptr = realloc(ptr, len, offset, 1) >>> 0;
    }
    return WASM_VECTOR_LEN = offset, ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    return (null === cachedDataViewMemory0 || !0 === cachedDataViewMemory0.buffer.detached || void 0 === cachedDataViewMemory0.buffer.detached && cachedDataViewMemory0.buffer !== wasm.memory.buffer) && (cachedDataViewMemory0 = new DataView(wasm.memory.buffer)), 
    cachedDataViewMemory0;
}

function debugString(val) {
    const type = typeof val;
    if ("number" == type || "boolean" == type || null == val) return `${val}`;
    if ("string" == type) return `"${val}"`;
    if ("symbol" == type) {
        const description = val.description;
        return null == description ? "Symbol" : `Symbol(${description})`;
    }
    if ("function" == type) {
        const name = val.name;
        return "string" == typeof name && name.length > 0 ? `Function(${name})` : "Function";
    }
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = "[";
        length > 0 && (debug += debugString(val[0]));
        for (let i = 1; i < length; i++) debug += ", " + debugString(val[i]);
        return debug += "]", debug;
    }
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (!(builtInMatches.length > 1)) return toString.call(val);
    if (className = builtInMatches[1], "Object" == className) try {
        return "Object(" + JSON.stringify(val) + ")";
    } catch (_) {
        return "Object";
    }
    return val instanceof Error ? `${val.name}: ${val.message}\n${val.stack}` : className;
}

const CLOSURE_DTORS = "undefined" == typeof FinalizationRegistry ? {
    register: () => {},
    unregister: () => {}
} : new FinalizationRegistry(state => {
    wasm.__wbindgen_export_2.get(state.dtor)(state.a, state.b);
});

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = {
        a: arg0,
        b: arg1,
        cnt: 1,
        dtor: dtor
    }, real = (...args) => {
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            0 === --state.cnt ? (wasm.__wbindgen_export_2.get(state.dtor)(a, state.b), CLOSURE_DTORS.unregister(state)) : state.a = a;
        }
    };
    return real.original = state, CLOSURE_DTORS.register(real, state, state), real;
}

function __wbg_adapter_28(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h39ffd099e3b9af6c(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_35(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h9de4dfc5842d2ae3(arg0, arg1, addHeapObject(arg2));
}

let cachedUint32ArrayMemory0 = null;

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(4 * arg.length, 4) >>> 0;
    return (null !== cachedUint32ArrayMemory0 && 0 !== cachedUint32ArrayMemory0.byteLength || (cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer)), 
    cachedUint32ArrayMemory0).set(arg, ptr / 4), WASM_VECTOR_LEN = arg.length, ptr;
}

function play_dot(position, duration_millis, motor_values, device_index) {
    const ptr0 = passArray32ToWasm0(motor_values, wasm.__wbindgen_malloc), len0 = WASM_VECTOR_LEN;
    return takeObject(wasm.play_dot(position, duration_millis, ptr0, len0, device_index));
}

let cachedFloat32ArrayMemory0 = null;

function passArrayF32ToWasm0(arg, malloc) {
    const ptr = malloc(4 * arg.length, 4) >>> 0;
    return (null !== cachedFloat32ArrayMemory0 && 0 !== cachedFloat32ArrayMemory0.byteLength || (cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer)), 
    cachedFloat32ArrayMemory0).set(arg, ptr / 4), WASM_VECTOR_LEN = arg.length, ptr;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}

function __wbg_get_imports() {
    const imports = {
        wbg: {}
    };
    return imports.wbg.__wbindgen_number_new = function(arg0) {
        return addHeapObject(arg0);
    }, imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    }, imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        return addHeapObject(getStringFromWasm0(arg0, arg1));
    }, imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
        const obj = getObject(arg1), ret = "string" == typeof obj ? obj : void 0;
        var ptr1 = null == ret ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc), len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4, len1, !0), getDataViewMemory0().setInt32(arg0 + 0, ptr1, !0);
    }, imports.wbg.__wbg_crypto_1d1f22824a6a080c = function(arg0) {
        return addHeapObject(getObject(arg0).crypto);
    }, imports.wbg.__wbindgen_is_object = function(arg0) {
        const val = getObject(arg0);
        return "object" == typeof val && null !== val;
    }, imports.wbg.__wbg_process_4a72847cc503995b = function(arg0) {
        return addHeapObject(getObject(arg0).process);
    }, imports.wbg.__wbg_versions_f686565e586dd935 = function(arg0) {
        return addHeapObject(getObject(arg0).versions);
    }, imports.wbg.__wbg_node_104a2ff8d6ea03a2 = function(arg0) {
        return addHeapObject(getObject(arg0).node);
    }, imports.wbg.__wbindgen_is_string = function(arg0) {
        return "string" == typeof getObject(arg0);
    }, imports.wbg.__wbg_require_cca90b1a94a0255b = function() {
        return handleError(function() {
            return addHeapObject(module.require);
        }, arguments);
    }, imports.wbg.__wbindgen_is_function = function(arg0) {
        return "function" == typeof getObject(arg0);
    }, imports.wbg.__wbg_msCrypto_eb05e62b530a1508 = function(arg0) {
        return addHeapObject(getObject(arg0).msCrypto);
    }, imports.wbg.__wbg_randomFillSync_5c9c955aa56b6049 = function() {
        return handleError(function(arg0, arg1) {
            getObject(arg0).randomFillSync(takeObject(arg1));
        }, arguments);
    }, imports.wbg.__wbg_getRandomValues_3aa56aa6edec874c = function() {
        return handleError(function(arg0, arg1) {
            getObject(arg0).getRandomValues(getObject(arg1));
        }, arguments);
    }, imports.wbg.__wbindgen_cb_drop = function(arg0) {
        const obj = takeObject(arg0).original;
        if (1 == obj.cnt--) return obj.a = 0, !0;
        return !1;
    }, imports.wbg.__wbg_queueMicrotask_12a30234db4045d3 = function(arg0) {
        queueMicrotask(getObject(arg0));
    }, imports.wbg.__wbg_queueMicrotask_48421b3cc9052b68 = function(arg0) {
        return addHeapObject(getObject(arg0).queueMicrotask);
    }, imports.wbg.__wbg_instanceof_Window_5012736c80a01584 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Window;
        } catch (_) {
            result = !1;
        }
        return result;
    }, imports.wbg.__wbg_setTimeout_73b734ca971c19f4 = function() {
        return handleError(function(arg0, arg1, arg2) {
            return getObject(arg0).setTimeout(getObject(arg1), arg2);
        }, arguments);
    }, imports.wbg.__wbg_data_5c47a6985fefc490 = function(arg0) {
        return addHeapObject(getObject(arg0).data);
    }, imports.wbg.__wbg_error_09480e4aadca50ad = function(arg0) {}, imports.wbg.__wbg_log_b103404cc5920657 = function(arg0) {}, 
    imports.wbg.__wbg_setonopen_7e770c87269cae90 = function(arg0, arg1) {
        getObject(arg0).onopen = getObject(arg1);
    }, imports.wbg.__wbg_setonerror_5ec4625df3060159 = function(arg0, arg1) {
        getObject(arg0).onerror = getObject(arg1);
    }, imports.wbg.__wbg_setonclose_40f935717ad6ffcd = function(arg0, arg1) {
        getObject(arg0).onclose = getObject(arg1);
    }, imports.wbg.__wbg_setonmessage_b670c12ea34acd8b = function(arg0, arg1) {
        getObject(arg0).onmessage = getObject(arg1);
    }, imports.wbg.__wbg_new_0bf4a5b0632517ed = function() {
        return handleError(function(arg0, arg1) {
            return addHeapObject(new WebSocket(getStringFromWasm0(arg0, arg1)));
        }, arguments);
    }, imports.wbg.__wbg_close_99bb12a22f16f79c = function() {
        return handleError(function(arg0) {
            getObject(arg0).close();
        }, arguments);
    }, imports.wbg.__wbg_send_82b52e2f9f8946d9 = function() {
        return handleError(function(arg0, arg1, arg2) {
            getObject(arg0).send(getStringFromWasm0(arg1, arg2));
        }, arguments);
    }, imports.wbg.__wbg_newnoargs_76313bd6ff35d0f2 = function(arg0, arg1) {
        return addHeapObject(new Function(getStringFromWasm0(arg0, arg1)));
    }, imports.wbg.__wbg_call_1084a111329e68ce = function() {
        return handleError(function(arg0, arg1) {
            return addHeapObject(getObject(arg0).call(getObject(arg1)));
        }, arguments);
    }, imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
        return addHeapObject(getObject(arg0));
    }, imports.wbg.__wbg_self_3093d5d1f7bcb682 = function() {
        return handleError(function() {
            return addHeapObject(self.self);
        }, arguments);
    }, imports.wbg.__wbg_window_3bcfc4d31bc012f8 = function() {
        return handleError(function() {
            return addHeapObject(window.window);
        }, arguments);
    }, imports.wbg.__wbg_globalThis_86b222e13bdf32ed = function() {
        return handleError(function() {
            return addHeapObject(globalThis.globalThis);
        }, arguments);
    }, imports.wbg.__wbg_global_e5a3fe56f8be9485 = function() {
        return handleError(function() {
            return addHeapObject(global.global);
        }, arguments);
    }, imports.wbg.__wbindgen_is_undefined = function(arg0) {
        return void 0 === getObject(arg0);
    }, imports.wbg.__wbg_call_89af060b4e1523f2 = function() {
        return handleError(function(arg0, arg1, arg2) {
            return addHeapObject(getObject(arg0).call(getObject(arg1), getObject(arg2)));
        }, arguments);
    }, imports.wbg.__wbg_new_b85e72ed1bfd57f9 = function(arg0, arg1) {
        try {
            var state0 = {
                a: arg0,
                b: arg1
            };
            const ret = new Promise((arg0, arg1) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return function(arg0, arg1, arg2, arg3) {
                        wasm.wasm_bindgen__convert__closures__invoke2_mut__h0616af040bff7ca8(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
                    }(a, state0.b, arg0, arg1);
                } finally {
                    state0.a = a;
                }
            });
            return addHeapObject(ret);
        } finally {
            state0.a = state0.b = 0;
        }
    }, imports.wbg.__wbg_resolve_570458cb99d56a43 = function(arg0) {
        return addHeapObject(Promise.resolve(getObject(arg0)));
    }, imports.wbg.__wbg_then_95e6edc0f89b73b1 = function(arg0, arg1) {
        return addHeapObject(getObject(arg0).then(getObject(arg1)));
    }, imports.wbg.__wbg_then_876bb3c633745cc6 = function(arg0, arg1, arg2) {
        return addHeapObject(getObject(arg0).then(getObject(arg1), getObject(arg2)));
    }, imports.wbg.__wbg_buffer_b7b08af79b0b0974 = function(arg0) {
        return addHeapObject(getObject(arg0).buffer);
    }, imports.wbg.__wbg_newwithbyteoffsetandlength_8a2cb9ca96b27ec9 = function(arg0, arg1, arg2) {
        return addHeapObject(new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0));
    }, imports.wbg.__wbg_new_ea1883e1e5e86686 = function(arg0) {
        return addHeapObject(new Uint8Array(getObject(arg0)));
    }, imports.wbg.__wbg_set_d1e79e2388520f18 = function(arg0, arg1, arg2) {
        getObject(arg0).set(getObject(arg1), arg2 >>> 0);
    }, imports.wbg.__wbg_newwithlength_ec548f448387c968 = function(arg0) {
        return addHeapObject(new Uint8Array(arg0 >>> 0));
    }, imports.wbg.__wbg_subarray_7c2e3576afe181d1 = function(arg0, arg1, arg2) {
        return addHeapObject(getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0));
    }, imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
        const ptr1 = passStringToWasm0(debugString(getObject(arg1)), wasm.__wbindgen_malloc, wasm.__wbindgen_realloc), len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4, len1, !0), getDataViewMemory0().setInt32(arg0 + 0, ptr1, !0);
    }, imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    }, imports.wbg.__wbindgen_memory = function() {
        return addHeapObject(wasm.memory);
    }, imports.wbg.__wbindgen_closure_wrapper271 = function(arg0, arg1, arg2) {
        return addHeapObject(makeMutClosure(arg0, arg1, 179, __wbg_adapter_28));
    }, imports.wbg.__wbindgen_closure_wrapper273 = function(arg0, arg1, arg2) {
        return addHeapObject(makeMutClosure(arg0, arg1, 179, __wbg_adapter_28));
    }, imports.wbg.__wbindgen_closure_wrapper275 = function(arg0, arg1, arg2) {
        return addHeapObject(makeMutClosure(arg0, arg1, 179, __wbg_adapter_28));
    }, imports.wbg.__wbindgen_closure_wrapper793 = function(arg0, arg1, arg2) {
        return addHeapObject(makeMutClosure(arg0, arg1, 325, __wbg_adapter_35));
    }, imports;
}

async function __wbg_init(module_or_path) {
    if (void 0 !== wasm) return wasm;
    void 0 !== module_or_path && Object.getPrototypeOf(module_or_path) === Object.prototype && ({module_or_path: module_or_path} = module_or_path), 
    void 0 === module_or_path && (module_or_path = new URL("bhaptics_web_bg.wasm", import.meta.url));
    const imports = __wbg_get_imports();
    ("string" == typeof module_or_path || "function" == typeof Request && module_or_path instanceof Request || "function" == typeof URL && module_or_path instanceof URL) && (module_or_path = fetch(module_or_path));
    const {instance: instance, module: module} = await async function(module, imports) {
        if ("function" == typeof Response && module instanceof Response) {
            if ("function" == typeof WebAssembly.instantiateStreaming) try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                if ("application/wasm" == module.headers.get("Content-Type")) throw e;
            }
            const bytes = await module.arrayBuffer();
            return await WebAssembly.instantiate(bytes, imports);
        }
        {
            const instance = await WebAssembly.instantiate(module, imports);
            return instance instanceof WebAssembly.Instance ? {
                instance: instance,
                module: module
            } : instance;
        }
    }(await module_or_path, imports);
    return function(instance, module) {
        return wasm = instance.exports, __wbg_init.__wbindgen_wasm_module = module, cachedDataViewMemory0 = null, 
        cachedFloat32ArrayMemory0 = null, cachedUint32ArrayMemory0 = null, cachedUint8ArrayMemory0 = null, 
        wasm;
    }(instance, module);
}

var PositionType;

!function(PositionType) {
    PositionType.Vest = "Vest", PositionType.ForearmL = "ForearmL", PositionType.ForearmR = "ForearmR", 
    PositionType.Head = "Head", PositionType.HandL = "HandL", PositionType.HandR = "HandR", 
    PositionType.FootL = "FootL", PositionType.FootR = "FootR", PositionType.GloveL = "GloveL", 
    PositionType.GloveR = "GloveR";
}(PositionType || (PositionType = {}));

class PositionUtils {
    static positionToType(position) {
        switch (position) {
          case 0:
          default:
            return PositionType.Vest;

          case 1:
            return PositionType.ForearmL;

          case 2:
            return PositionType.ForearmR;

          case 3:
            return PositionType.Head;

          case 4:
            return PositionType.HandL;

          case 5:
            return PositionType.HandR;

          case 6:
            return PositionType.FootL;

          case 7:
            return PositionType.FootR;

          case 8:
            return PositionType.GloveL;

          case 9:
            return PositionType.GloveR;
        }
    }
    static enumToPosition(position) {
        switch (position) {
          case PositionType.Vest:
            return 0;

          case PositionType.ForearmL:
            return 1;

          case PositionType.ForearmR:
            return 2;

          case PositionType.Head:
            return 3;

          case PositionType.HandL:
            return 4;

          case PositionType.HandR:
            return 5;

          case PositionType.FootL:
            return 6;

          case PositionType.FootR:
            return 7;

          case PositionType.GloveL:
            return 8;

          case PositionType.GloveR:
            return 9;

          default:
            return 10;
        }
    }
}

const utils_sleep = ms => new Promise(resolve => {
    setTimeout(resolve, ms);
}), Tact = {
    init: async ({appId: appId, apiKey: apiKey}) => (await __wbg_init(), await function(app_id, api_key, init_json_string) {
        const ptr0 = passStringToWasm0(app_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc), len0 = WASM_VECTOR_LEN, ptr1 = passStringToWasm0(api_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc), len1 = WASM_VECTOR_LEN, ptr2 = passStringToWasm0(init_json_string, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc), len2 = WASM_VECTOR_LEN;
        return takeObject(wasm.registry_and_initialize(ptr0, len0, ptr1, len1, ptr2, len2));
    }(appId, apiKey, "")),
    async ping(address) {
        await function(address) {
            const ptr0 = passStringToWasm0(address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc), len0 = WASM_VECTOR_LEN;
            return takeObject(wasm.ping(ptr0, len0));
        }(address);
    },
    async pingAll() {
        await takeObject(wasm.ping_all());
    },
    async motorTest() {
        for (let index = 0; index < 40; index++) {
            const testMotor = Array.from({
                length: 40
            }, () => 0);
            testMotor[index] = 100, await play_dot(0, 1e3, testMotor, -1), await utils_sleep(1e3);
        }
    },
    async play({eventKey: eventKey, startTime: startTime = 0, intensityRatio: intensityRatio = 1, durationRatio: durationRatio = 1, offsetX: offsetX = 0, offsetY: offsetY = 0, deviceIndex: deviceIndex = -1}) {
        await function(key, start_millis, intensity, duration_ratio, angle_x, offset_y, device_index) {
            const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc), len0 = WASM_VECTOR_LEN;
            return takeObject(wasm.play_with_start_time(ptr0, len0, start_millis, intensity, duration_ratio, angle_x, offset_y, device_index));
        }(eventKey, startTime, intensityRatio, durationRatio, offsetX, offsetY, deviceIndex);
    },
    playLoop: async ({eventKey: eventKey, intensityRatio: intensityRatio = 1, durationRatio: durationRatio = 1, interval: interval = 1e3, maxCount: maxCount = 1, offsetX: offsetX = 0, offsetY: offsetY = 0, deviceIndex: deviceIndex = -1}) => await function(key, intensity, duration_ratio, angle_x, offset_y, interval, max_count, device_index) {
        const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc), len0 = WASM_VECTOR_LEN;
        return takeObject(wasm.play_loop(ptr0, len0, intensity, duration_ratio, angle_x, offset_y, interval, max_count, device_index));
    }(eventKey, intensityRatio, durationRatio, offsetX, offsetY, interval, maxCount, deviceIndex),
    async playGlove({position: position, motors: motors, playtimes: playtimes, shapes: shapes, repeatCount: repeatCount}) {
        const enumPosition = PositionUtils.enumToPosition(position);
        return await function(position, motors, playtimes, shapes, repeat_count) {
            const ptr0 = passArray32ToWasm0(motors, wasm.__wbindgen_malloc), len0 = WASM_VECTOR_LEN, ptr1 = passArray32ToWasm0(playtimes, wasm.__wbindgen_malloc), len1 = WASM_VECTOR_LEN, ptr2 = passArray32ToWasm0(shapes, wasm.__wbindgen_malloc), len2 = WASM_VECTOR_LEN;
            return takeObject(wasm.play_glove(position, ptr0, len0, ptr1, len1, ptr2, len2, repeat_count));
        }(enumPosition, motors, playtimes, shapes, repeatCount);
    },
    async playDot({position: position, motorValues: motorValues, duration: duration = 500, deviceIndex: deviceIndex = -1}) {
        const enumPosition = PositionUtils.enumToPosition(position), motors = new Int32Array(motorValues);
        return await play_dot(enumPosition, duration, motors, deviceIndex);
    },
    async playPath({position: position, x: x, y: y, intensity: intensity, duration: duration = 40, deviceIndex: deviceIndex = -1}) {
        const enumPosition = PositionUtils.enumToPosition(position), xValues = new Float32Array(x), yValues = new Float32Array(y), intensityValues = new Int32Array(intensity);
        return await function(position, duration_millis, x, y, intensity, device_index) {
            const ptr0 = passArrayF32ToWasm0(x, wasm.__wbindgen_malloc), len0 = WASM_VECTOR_LEN, ptr1 = passArrayF32ToWasm0(y, wasm.__wbindgen_malloc), len1 = WASM_VECTOR_LEN, ptr2 = passArray32ToWasm0(intensity, wasm.__wbindgen_malloc), len2 = WASM_VECTOR_LEN;
            return takeObject(wasm.play_path(position, duration_millis, ptr0, len0, ptr1, len1, ptr2, len2, device_index));
        }(enumPosition, duration, xValues, yValues, intensityValues, deviceIndex);
    },
    pause: async eventKey => await function(event) {
        const ptr0 = passStringToWasm0(event, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc), len0 = WASM_VECTOR_LEN;
        return takeObject(wasm.pause(ptr0, len0));
    }(eventKey),
    resume: async eventKey => await function(event) {
        const ptr0 = passStringToWasm0(event, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc), len0 = WASM_VECTOR_LEN;
        return takeObject(wasm.resume(ptr0, len0));
    }(eventKey),
    async stop(eventKey) {
        await function(event_name) {
            const ptr0 = passStringToWasm0(event_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc), len0 = WASM_VECTOR_LEN;
            return takeObject(wasm.stop_by_event_name(ptr0, len0));
        }(eventKey);
    },
    async stopAll() {
        await takeObject(wasm.stop_all());
    },
    async getConnectedDevices() {
        try {
            const result = await takeObject(wasm.get_device_info_json()), devicesInfo = JSON.parse(result);
            return Array.isArray(devicesInfo) ? devicesInfo : [];
        } catch (error) {
            return [];
        }
    },
    async getHapticMappings() {
        try {
            const result = await takeObject(wasm.get_haptic_mappings_json()), hapticMappings = JSON.parse(result);
            return Array.isArray(hapticMappings) ? hapticMappings : [];
        } catch (error) {
            return [];
        }
    },
    getEvent: async eventKey => await function(event_name) {
        const ptr0 = passStringToWasm0(event_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc), len0 = WASM_VECTOR_LEN;
        return takeObject(wasm.get_event_time(ptr0, len0));
    }(eventKey),
    async isDeviceConnected(position) {
        const enumPosition = PositionUtils.enumToPosition(position);
        return await function(position) {
            return takeObject(wasm.is_bhaptics_device_connected(position));
        }(enumPosition);
    },
    isConnected: async () => await takeObject(wasm.is_connected()),
    isPlaying: async () => await takeObject(wasm.is_playing_event()),
    isPlayingByEventKey: async eventKey => await function(event_id) {
        const ptr0 = passStringToWasm0(event_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc), len0 = WASM_VECTOR_LEN;
        return takeObject(wasm.is_playing_event_by_event_id(ptr0, len0));
    }(eventKey)
};

export { PositionType, PositionUtils, Tact as default };
//# sourceMappingURL=bundle.js.map
