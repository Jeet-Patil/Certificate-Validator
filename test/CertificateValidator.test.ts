import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import type { CertificateValidator } from "../typechain-types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("CertificateValidator", function () {
  let certificateValidator: CertificateValidator;
  let owner: HardhatEthersSigner;
  let issuer: HardhatEthersSigner;
  let recipient: HardhatEthersSigner;
  let user: HardhatEthersSigner;

  const certificateId = ethers.keccak256(ethers.toUtf8Bytes("CERT-001"));
  const certificateHash = ethers.keccak256(ethers.toUtf8Bytes("Certificate Content Hash"));
  const metadataURI = "ipfs://QmExample123456789";

  beforeEach(async function () {
    // Get signers
    [owner, issuer, recipient, user] = await ethers.getSigners();

    // Deploy contract
    const CertificateValidatorFactory = await ethers.getContractFactory("CertificateValidator");
    const deployed = await CertificateValidatorFactory.deploy();
    await deployed.waitForDeployment();
    certificateValidator = deployed as unknown as CertificateValidator;
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await certificateValidator.getAddress()).to.be.properAddress;
    });
  });

  describe("Certificate Issuance", function () {
    it("Should issue certificate successfully", async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year from now

      const tx = await certificateValidator.issueCertificate(
        certificateId,
        certificateHash,
        recipient.address,
        expiryDate,
        metadataURI
      );

      await expect(tx)
        .to.emit(certificateValidator, "CertificateIssued")
        .withArgs(
          certificateId,
          certificateHash,
          owner.address,
          recipient.address,
          await time.latest(),
          expiryDate
        );

      expect(await certificateValidator.certificateExists(certificateId)).to.be.true;
    });

    it("Should issue certificate without expiry date", async function () {
      await certificateValidator.issueCertificate(
        certificateId,
        certificateHash,
        recipient.address,
        0, // No expiry
        metadataURI
      );

      const cert = await certificateValidator.getCertificate(certificateId);
      expect(cert.expiryDate).to.equal(0);
    });

    it("Should allow anyone to issue certificate", async function () {
      await expect(
        certificateValidator.connect(user).issueCertificate(
          certificateId,
          certificateHash,
          recipient.address,
          0,
          metadataURI
        )
      ).to.emit(certificateValidator, "CertificateIssued");
    });

    it("Should not issue duplicate certificate", async function () {
      await certificateValidator.issueCertificate(
        certificateId,
        certificateHash,
        recipient.address,
        0,
        metadataURI
      );

      await expect(
        certificateValidator.issueCertificate(
          certificateId,
          certificateHash,
          recipient.address,
          0,
          metadataURI
        )
      ).to.be.revertedWith("Certificate already exists");
    });

    it("Should not issue certificate to zero address", async function () {
      await expect(
        certificateValidator.issueCertificate(
          certificateId,
          certificateHash,
          ethers.ZeroAddress,
          0,
          metadataURI
        )
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("Should not issue certificate with past expiry date", async function () {
      const pastDate = Math.floor(Date.now() / 1000) - 1000; // Past date

      await expect(
        certificateValidator.issueCertificate(
          certificateId,
          certificateHash,
          recipient.address,
          pastDate,
          metadataURI
        )
      ).to.be.revertedWith("Invalid expiry date");
    });
  });

  describe("Certificate Verification", function () {
    beforeEach(async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      await certificateValidator.issueCertificate(
        certificateId,
        certificateHash,
        recipient.address,
        expiryDate,
        metadataURI
      );
    });

    it("Should verify valid certificate", async function () {
      const [isValid, reason] = await certificateValidator.verifyCertificate(certificateId);
      expect(isValid).to.be.true;
      expect(reason).to.equal("Certificate is valid");
    });

    it("Should return false for non-existent certificate", async function () {
      const fakeCertId = ethers.keccak256(ethers.toUtf8Bytes("FAKE-CERT"));
      const [isValid, reason] = await certificateValidator.verifyCertificate(fakeCertId);
      expect(isValid).to.be.false;
      expect(reason).to.equal("Certificate does not exist");
    });

    it("Should verify certificate hash", async function () {
      const isMatch = await certificateValidator.verifyCertificateHash(
        certificateId,
        certificateHash
      );
      expect(isMatch).to.be.true;
    });

    it("Should return false for incorrect hash", async function () {
      const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("Wrong Hash"));
      const isMatch = await certificateValidator.verifyCertificateHash(
        certificateId,
        wrongHash
      );
      expect(isMatch).to.be.false;
    });

    it("Should get certificate details", async function () {
      const cert = await certificateValidator.getCertificate(certificateId);
      expect(cert.certificateHash).to.equal(certificateHash);
      expect(cert.issuer).to.equal(owner.address);
      expect(cert.recipient).to.equal(recipient.address);
      expect(cert.revoked).to.be.false;
      expect(cert.metadataURI).to.equal(metadataURI);
    });
  });

  describe("Certificate Revocation", function () {
    beforeEach(async function () {
      await certificateValidator.issueCertificate(
        certificateId,
        certificateHash,
        recipient.address,
        0,
        metadataURI
      );
    });

    it("Should revoke certificate successfully", async function () {
      await expect(certificateValidator.revokeCertificate(certificateId))
        .to.emit(certificateValidator, "CertificateRevoked")
        .withArgs(certificateId, owner.address, await time.latest() + 1);

      const cert = await certificateValidator.getCertificate(certificateId);
      expect(cert.revoked).to.be.true;
    });

    it("Should fail verification for revoked certificate", async function () {
      await certificateValidator.revokeCertificate(certificateId);

      const [isValid, reason] = await certificateValidator.verifyCertificate(certificateId);
      expect(isValid).to.be.false;
      expect(reason).to.equal("Certificate has been revoked");
    });

    it("Should allow anyone to revoke certificate", async function () {
      await expect(
        certificateValidator.connect(user).revokeCertificate(certificateId)
      ).to.emit(certificateValidator, "CertificateRevoked");
    });

    it("Should not revoke non-existent certificate", async function () {
      const fakeCertId = ethers.keccak256(ethers.toUtf8Bytes("FAKE-CERT"));
      await expect(
        certificateValidator.revokeCertificate(fakeCertId)
      ).to.be.revertedWith("Certificate does not exist");
    });

    it("Should not revoke already revoked certificate", async function () {
      await certificateValidator.revokeCertificate(certificateId);

      await expect(
        certificateValidator.revokeCertificate(certificateId)
      ).to.be.revertedWith("Certificate already revoked");
    });
  });

  describe("Certificate Expiry", function () {
    it("Should fail verification for expired certificate", async function () {
      const expiryDate = (await time.latest()) + 1000; // Expires in 1000 seconds
      
      const expiredCertId = ethers.keccak256(ethers.toUtf8Bytes("CERT-EXPIRED"));
      await certificateValidator.issueCertificate(
        expiredCertId,
        certificateHash,
        recipient.address,
        expiryDate,
        metadataURI
      );

      // Fast forward time past expiry
      await time.increaseTo(expiryDate + 1);

      const [isValid, reason] = await certificateValidator.verifyCertificate(expiredCertId);
      expect(isValid).to.be.false;
      expect(reason).to.equal("Certificate has expired");
    });

    it("Should pass verification before expiry", async function () {
      const expiryDate = (await time.latest()) + 1000;
      
      const validCertId = ethers.keccak256(ethers.toUtf8Bytes("CERT-VALID"));
      await certificateValidator.issueCertificate(
        validCertId,
        certificateHash,
        recipient.address,
        expiryDate,
        metadataURI
      );

      const [isValid, reason] = await certificateValidator.verifyCertificate(validCertId);
      expect(isValid).to.be.true;
      expect(reason).to.equal("Certificate is valid");
    });
  });

  describe("Certificate Enumeration", function () {
    it("Should track total certificates", async function () {
      expect(await certificateValidator.getTotalCertificates()).to.equal(0);

      await certificateValidator.issueCertificate(
        certificateId,
        certificateHash,
        recipient.address,
        0,
        metadataURI
      );

      expect(await certificateValidator.getTotalCertificates()).to.equal(1);
    });

    it("Should get certificate by index", async function () {
      await certificateValidator.issueCertificate(
        certificateId,
        certificateHash,
        recipient.address,
        0,
        metadataURI
      );

      const certId = await certificateValidator.getCertificateIdByIndex(0);
      expect(certId).to.equal(certificateId);
    });

    it("Should revert when index out of bounds", async function () {
      await expect(
        certificateValidator.getCertificateIdByIndex(0)
      ).to.be.revertedWith("Index out of bounds");
    });
  });
});
