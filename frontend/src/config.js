// REPLACE WITH YOUR DEPLOYED CONTRACT ADDRESS
export const CONTRACT_ADDRESS = "0x2F955D735df0268F37EfEE68aD409d0E928aD890";

// Contract ABI
export const CONTRACT_ABI = [
    "function issueCertificate(bytes32 _certificateId, bytes32 _certificateHash, address _recipient, uint256 _expiryDate, string memory _metadataURI) external",
    "function verifyCertificate(bytes32 _certificateId) external view returns (bool isValid, string memory reason)",
    "function getCertificate(bytes32 _certificateId) external view returns (tuple(bytes32 certificateHash, address issuer, address recipient, uint256 issueDate, uint256 expiryDate, bool revoked, string metadataURI))",
    "function revokeCertificate(bytes32 _certificateId) external",
    "function getTotalCertificates() external view returns (uint256)",
    "function getCertificateIdByIndex(uint256 _index) external view returns (bytes32)",
    "event CertificateIssued(bytes32 indexed certificateId, bytes32 certificateHash, address indexed issuer, address indexed recipient, uint256 issueDate, uint256 expiryDate)",
    "event CertificateRevoked(bytes32 indexed certificateId, address indexed revokedBy, uint256 revokeDate)"
];
