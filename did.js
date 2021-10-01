const ION = require('@decentralized-identity/ion-tools')
const fs = require('fs').promises


const main = async () => {
    // Create private/public key pair
    const authnKeys = await ION.generateKeyPair('secp256k1')
    console.log("Created private/public key pair")
    console.log("Public key:", authnKeys.publicJwk)

    // Write private and public key to files
    await fs.writeFile(
        'publicKey.json',
        JSON.stringify(authnKeys.publicJwk)
    )
    console.log("Wrote public key to publicKey.json")
    await fs.writeFile(
        'privateKey.json',
        JSON.stringify(authnKeys.privateJwk)
    )
    console.log("Wrote private key to privateKey.json")

    // Create a DID
    const did = new ION.DID({
        content: {
            publicKeys: [
                {
                    id: 'auth-key',
                    type: 'EcdsaSecp256k1VerificationKey2019',
                    publicKeyJwk: authnKeys.publicJwk,
                    purposes: ['authentication']
                }
            ],
            services: [
                {
                    id: "IdentityHub",
                    type: "IdentityHub",
                    serviceEndpoint: {
                        "@context": "schema.identity.foundation/hub",
                        "@type": "UserServiceEndpoint",
                        instance: [
                            "did:test:hub.id",
                        ]
                    }
                }
            ],
        }
    })

    const didUri = await did.getURI('short')
    console.log("Generated DID:", didUri)

    const anchorRequestBody = await did.generateRequest()
    const anchorRequest = new ION.AnchorRequest(anchorRequestBody)
    const anchorResponse = await anchorRequest.submit()
    console.log("Anchor response", anchorResponse)

    const response = await ION.resolve('did:ion:EiCjHFpU1Fm6Qnq7XIj_Gt2QGCpnwQrrnUWoVrM4H9we1A')
    console.log(JSON.stringify(response))

    const privateKey = JSON.parse(await fs.readFile('privateKey.json'))
    const myData = 'This message is signed and cannot be tempered with'
    const signature = await ION.signJws({
        payload: myData,
        privateJwk: privateKey
    });
    console.log("Signed JWS:", signature)

    const randomKeyPair = await ION.generateKeyPair('secp256k1')
    let verifiedJws = await ION.verifyJws({
        jws: signature,
        publicJwk: randomKeyPair.publicJwk
    })
    console.log("Verify with random new key:", verifiedJws)

    const publicKey = JSON.parse(await fs.readFile('publicKey.json'))
    verifiedJws = await ION.verifyJws({
        jws: signature,
        publicJwk: publicKey
    })
    console.log("Verify with my public key:", verifiedJws)
}

main()
