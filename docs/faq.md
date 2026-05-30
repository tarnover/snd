## How big of a file can I transfer with SND?

There is a 2GB file size limit built in to SND, but this may be changed by the
hoster. SND encrypts and decrypts the files in the browser which is great for
security but will tax your system resources.  In particular you can expect to
see your memory usage go up by at least the size of the file when the transfer
is processing.  You can see [the results of some
testing](https://github.com/mozilla/send/issues/170#issuecomment-314107793). For
the most reliable operation on common computers, it’s probably best to stay
under a few hundred megabytes.

## Why is my browser not supported?

We’re using the [Web Cryptography JavaScript API with the AES-GCM
algorithm](https://www.w3.org/TR/WebCryptoAPI/#aes-gcm) for our encryption.
Many browsers support this standard and should work fine, but some have not
implemented it yet (mobile browsers lag behind on this, in
particular).

## Why does SND require JavaScript?

SND uses JavaScript to:

- Encrypt and decrypt files locally on the client instead of the server.
- Render the user interface.
- Manage translations on the website into [various different languages](https://github.com/tarnover/snd#localization).
- (Original upstream only) Collect data in accordance with the operator's stated terms. This fork does not ship any analytics or telemetry. Each operator is responsible for documenting their own privacy practices.

Since SND is an open-source project, you can read the source at <https://github.com/tarnover/snd>.

## Is the web UI "zero-knowledge"?

Not in the strong sense the term usually implies, and we deliberately don't
market it that way. The web UI is **end-to-end encrypted in your browser**:
your file is encrypted before it leaves your device, the decryption key lives
in the link fragment (after the `#`) and never reaches the server, and the
server only ever stores ciphertext plus minimal metadata.

The honest limitation is that the same server also ships the JavaScript that
does the encryption. A passive breach of the server or storage can't read your
files — but an *actively malicious or compromised* server could serve modified
JavaScript that steals the key from the link. This is a structural property of
**every** browser-delivered E2EE app, not specific to SND; tools that brand
their web client "zero-knowledge" share this exact limitation whether they say
so or not.

What each client actually protects against:

| Threat | Web UI | [`sndr`](https://github.com/tarnover/sndr) CLI |
|---|---|---|
| Reading file contents after a passive server/storage breach | ✅ | ✅ |
| Reading filenames / sizes / types after a passive breach | ✅ | ✅ |
| Network / TLS eavesdropper reading contents | ✅ | ✅ |
| An actively malicious server serving targeted JS to steal the key | ❌ | ✅ |
| The operator seeing IPs, file sizes, timing, or denying service | ❌ | ❌ |

For workflows where the operator-shipped-JS risk is unacceptable, use the
`sndr` command-line client: it ships its own copy of the protocol, so a
malicious server can't swap out the crypto layer. See
[`docs/security.md`](./security.md) for the full threat model.

## Is there a command-line client?

Yes — [`sndr`](https://github.com/tarnover/sndr) is a fully-featured CLI that speaks the SND protocol. It can upload, download, set/clear passwords, change params, and delete shares. It is the recommended client for any sensitive workflow because, unlike the web UI, it doesn't trust the operator to ship correct JavaScript.

## How long are files available for?

Files are available to be downloaded for 24 hours, after which they are removed
from the server.  They are also removed immediately once the download limit is reached.

## Can a file be downloaded more than once?

Yes, once a file is submitted to SND you can select the download limit.


*Disclaimer: SND is an experiment and under active development.  The answers
here may change as we get feedback from you and the project matures.*
