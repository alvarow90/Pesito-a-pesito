const hre = require('hardhat')

async function main() {
  console.log('Deploying SubscriptionManager contract...')

  // Get the Contract Factory
  const SubscriptionManager = await hre.ethers.getContractFactory(
    'SubscriptionManager'
  )

  // Deploy the contract
  const subscriptionManager = await SubscriptionManager.deploy()

  // Wait for deployment to complete
  await subscriptionManager.waitForDeployment()

  const address = await subscriptionManager.getAddress()
  console.log('SubscriptionManager deployed to:', address)
  console.log(
    'Update your NEXT_PUBLIC_CONTRACT_ADDRESS environment variable with this address'
  )

  // Wait for confirmations for Etherscan verification
  console.log('Waiting for confirmations...')
  await hre.ethers.provider.waitForTransaction(
    subscriptionManager.deploymentTransaction().hash,
    5
  )

  // Verify contract on Etherscan if API key is present
  const { ETHERSCAN_API_KEY } = process.env
  if (ETHERSCAN_API_KEY) {
    console.log('Verifying contract on Etherscan...')
    try {
      await hre.run('verify:verify', {
        address: address,
        constructorArguments: []
      })
      console.log('Contract verified on Etherscan!')
    } catch (error) {
      console.error('Error verifying contract:', error)
    }
  } else {
    console.log('Skipping Etherscan verification - no API key provided')
  }
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
