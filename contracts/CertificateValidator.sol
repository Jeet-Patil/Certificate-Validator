// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CertificateValidator
 * @dev Smart contract for issuing and validating certificates on Ethereum blockchain
 * @notice This contract allows anyone to create and verify certificates
 */
contract CertificateValidator {

    struct Certificate {
        bytes32 certificateHash;
        address issuer;
        address recipient;
        uint256 issueDate;
        uint256 expiryDate;
        bool revoked;
        string metadataURI;
    }

    // Mapping from certificate ID to Certificate
    mapping(bytes32 => Certificate) public certificates;
    
    // Mapping to check if a certificate exists
    mapping(bytes32 => bool) public certificateExists;
    
    // Array to store all certificate IDs
    bytes32[] public certificateIds;

    // Events
    event CertificateIssued(
        bytes32 indexed certificateId,
        bytes32 certificateHash,
        address indexed issuer,
        address indexed recipient,
        uint256 issueDate,
        uint256 expiryDate
    );

    event CertificateRevoked(
        bytes32 indexed certificateId,
        address indexed revokedBy,
        uint256 revokeDate
    );



    /**
     * @dev Issue a new certificate
     * @param _certificateId Unique identifier for the certificate
     * @param _certificateHash Hash of the certificate content
     * @param _recipient Address of the certificate recipient
     * @param _expiryDate Expiry date timestamp (0 for no expiry)
     * @param _metadataURI URI pointing to certificate metadata (IPFS, etc.)
     */
    function issueCertificate(
        bytes32 _certificateId,
        bytes32 _certificateHash,
        address _recipient,
        uint256 _expiryDate,
        string calldata _metadataURI
    ) external {
        require(!certificateExists[_certificateId], "Certificate already exists");
        require(_recipient != address(0), "Invalid recipient address");
        require(_expiryDate == 0 || _expiryDate > block.timestamp, "Invalid expiry date");

        certificates[_certificateId] = Certificate({
            certificateHash: _certificateHash,
            issuer: msg.sender,
            recipient: _recipient,
            issueDate: block.timestamp,
            expiryDate: _expiryDate,
            revoked: false,
            metadataURI: _metadataURI
        });

        certificateExists[_certificateId] = true;
        unchecked {
            certificateIds.push(_certificateId);
        }

        emit CertificateIssued(
            _certificateId,
            _certificateHash,
            msg.sender,
            _recipient,
            block.timestamp,
            _expiryDate
        );
    }

    /**
     * @dev Revoke an existing certificate
     * @param _certificateId ID of the certificate to revoke
     */
    function revokeCertificate(bytes32 _certificateId) external {
        require(certificateExists[_certificateId], "Certificate does not exist");
        require(!certificates[_certificateId].revoked, "Certificate already revoked");

        certificates[_certificateId].revoked = true;

        emit CertificateRevoked(_certificateId, msg.sender, block.timestamp);
    }

    /**
     * @dev Verify if a certificate is valid
     * @param _certificateId ID of the certificate to verify
     * @return isValid True if certificate is valid, false otherwise
     * @return reason Reason if certificate is invalid
     */
    function verifyCertificate(bytes32 _certificateId) 
        external 
        view 
        returns (bool isValid, string memory reason) 
    {
        if (!certificateExists[_certificateId]) {
            return (false, "Certificate does not exist");
        }

        Certificate memory cert = certificates[_certificateId];

        if (cert.revoked) {
            return (false, "Certificate has been revoked");
        }

        if (cert.expiryDate != 0 && block.timestamp > cert.expiryDate) {
            return (false, "Certificate has expired");
        }

        return (true, "Certificate is valid");
    }

    /**
     * @dev Get certificate details
     * @param _certificateId ID of the certificate
     * @return Certificate struct containing all certificate information
     */
    function getCertificate(bytes32 _certificateId) 
        external 
        view 
        returns (Certificate memory) 
    {
        require(certificateExists[_certificateId], "Certificate does not exist");
        return certificates[_certificateId];
    }

    /**
     * @dev Verify certificate hash matches stored hash
     * @param _certificateId ID of the certificate
     * @param _certificateHash Hash to verify
     * @return True if hash matches, false otherwise
     */
    function verifyCertificateHash(bytes32 _certificateId, bytes32 _certificateHash) 
        external 
        view 
        returns (bool) 
    {
        if (!certificateExists[_certificateId]) {
            return false;
        }
        return certificates[_certificateId].certificateHash == _certificateHash;
    }

    /**
     * @dev Get total number of certificates issued
     * @return Total count of certificates
     */
    function getTotalCertificates() external view returns (uint256) {
        return certificateIds.length;
    }

    /**
     * @dev Get certificate ID by index
     * @param _index Index in the certificateIds array
     * @return Certificate ID
     */
    function getCertificateIdByIndex(uint256 _index) external view returns (bytes32) {
        require(_index < certificateIds.length, "Index out of bounds");
        return certificateIds[_index];
    }

}
