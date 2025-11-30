import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0xB55f334eab6795449554E96CF4614de4AaE1b846";

  console.log("🔍 Checking certificate count...");

  const CertificateValidator = await ethers.getContractAt(
    "CertificateValidator",
    contractAddress
  );

  const count = await CertificateValidator.getTotalCertificates();
  console.log("Total certificates:", Number(count));

  if (Number(count) > 0) {
    console.log("\n📜 Certificate IDs:");
    for (let i = 0; i < Number(count); i++) {
      const certId = await CertificateValidator.getCertificateIdByIndex(i);
      const cert = await CertificateValidator.getCertificate(certId);
      console.log(`\n${i + 1}. ID: ${certId}`);
      console.log(`   Issuer: ${cert.issuer}`);
      console.log(`   Recipient: ${cert.recipient}`);
      console.log(`   Metadata: ${cert.metadataURI}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
