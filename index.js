const telnetlib = require('telnetlib');
const ZVM = require('ifvms/dist/zvm');
const fs = require('fs');
const GlkOte = require('glkote-term');
const MuteStream = require('mute-stream');
const readline = require('readline');

const stream = require("stream");

class ConvertNewlines extends stream.Transform {
    _transform(chunk, _encoding, callback) {
        if (chunk instanceof Buffer) {
            chunk = chunk.toString('utf-8');
        }

        if (typeof chunk == "string") {
            chunk = chunk.replace(/\n/g, '\r\n');
        }
        callback(null, chunk);
    }
}

class MyGlkOte extends GlkOte {

    constructor(rl_opts) {
        super(rl_opts)
        this.onExit = rl_opts.onExit;
    }

    accept_specialinput(data) {
        setImmediate(() => this.send_response('specialresponse', null, 'fileref_prompt', { ref: 'x.x' }));
    }

    exit() {
        super.exit();

        if (this.onExit) {
            this.onExit();
        }
    }
}

class MyDialog {

    file_write() {
        return false;
    }
    file_ref_exists() {
        return false;
    }
}

const server = telnetlib.createServer({}, (c) => {
    let vm = new ZVM();
    let Glk = MyGlkOte.Glk;

    const stdin = c;
    stdin.setRawMode = () => {};

    const stdout = new MuteStream();
    stdout.pipe(new ConvertNewlines()).pipe(c);

    const rl = readline.createInterface({
        input: stdin,
        output: stdout,
        prompt: '',
    })

    const rl_opts = {
        rl: rl,
        stdin: stdin,
        stdout: stdout,
        onExit: () => {
            c.end();
        }
    }

    const glkOte = new MyGlkOte(rl_opts)
    let options = {
        vm: vm,
        Dialog: new MyDialog(),
        Glk: Glk,
        GlkOte: glkOte
    };

    vm.prepare(fs.readFileSync('zdungeon.z5'), options);

    Glk.init(options);

});

server.listen(23);