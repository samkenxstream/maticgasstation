const Web3 = require('web3')

module.exports = class Web3Client {
  pendingSubscription = null

  constructor(rpcs) {
    this.web3 = new Web3()
    this.isReconnecting = false
    this.rpcs = rpcs
    this.rpcIndex = rpcs.length - 1
    this.reconnectAttempts = 0
  }

  getProvider = () => {
    if (this.rpcIndex == 0) {
      this.reconnectAttemps += 1
    }
    this.rpcIndex = (this.rpcIndex + 1) % this.rpcs.length
    console.log(`❓ Trying to connect to ${this.rpcs[this.rpcIndex]}`)
    return new Web3.providers.WebsocketProvider(this.rpcs[this.rpcIndex], {
      reconnect: {
        auto: true,
        delay: 5000, // ms
        maxAttempts: 5,
        onTimeout: false,
      },
    })
  }

  async setRPC() {
    const provider = this.getProvider()
    const result = await this.web3.setProvider(provider)
    if (result) {
      this.isReconnecting = false
    }
    provider.on('connect', () => {
      console.log(`✅ Successfully connected to ${this.rpcs[this.rpcIndex]}`)
      this.reconnectAttempts = 0
    })
    provider.on('error', () => {
      console.log(`❗ Error on connection to ${this.rpcs[this.rpcIndex]}`)
      this.reconnectAttempts += 1
      if (!this.isReconnecting) { this.reconnectRPC() }
    })
    provider.on('end', () => {
      console.log(`❗ Ended connection to ${this.rpcs[this.rpcIndex]}`)
      this.reconnectAttempts += 1
      if (!this.isReconnecting) { this.reconnectRPC() }
    })
  }

  initClient() {
    this.setRPC()
    this.pendingSubscription = this.web3.eth.subscribe('pendingTransactions', (err, res) => {
      if (err) {
        console.log('❗ Error on pending transactions subscription')
        if (err.message !== 'Maximum number of reconnect attempts reached!') {
          console.error(err)
        }
      }
    })
  }

  reconnectRPC() {
    if (this.reconnectAttempts > 6) {
      console.log('❌ Maximum attempts to eshtablish connection reached - Terminating Application')
      process.exit(1)
    }
    this.isReconnecting = true
    this.initClient()
  }
}
