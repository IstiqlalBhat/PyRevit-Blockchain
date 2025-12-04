// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EmbodiedCarbonLedgerV2 (gas-optimised)
 * NOTE:  • All public state-variables, function names, and event names
 *          remain identical – the front-end ABI is unchanged.
 *        • No business-logic or maths has been altered.
 *        • Only gas-saving refactors have been applied.
 */
contract EmbodiedCarbonLedgerV2 {
    /* ────────────────  CUSTOM ERRORS  ──────────────── */
    error OnlyOwner();
    error NotAuthorised();
    error EmptyJSON();
    error VolumeZero();
    error InvalidAddress();

    /* ────────────────  ENUMS & STRUCTS  ────────────── */
    enum Material { Concrete, CLT, Steel }

    struct EmissionsRecord {
        address user;          // 20 bytes
        Material material;     // 1 byte
        uint256 volume;        // m³ × 1e6
        uint256 a1A3;
        uint256 a4;
        uint256 a5w;
        uint256 total;
        uint256 timestamp;
        string  projectId;
    }

    struct JSONBlobRecord {
        address user;
        string  data;
        uint256 timestamp;
        string  projectId;
    }

    struct ProjectSummary {
        uint256 totalConcrete;
        uint256 totalCLT;
        uint256 totalSteel;
        uint256 totalEmissions;
        uint256 recordCount;
        uint256 lastUpdated;
    }

    /* ────────────────  STORAGE  ────────────────────── */
    address public owner;
    uint256 public materialRecordCount;
    uint256 public jsonRecordCount;

    mapping(uint256 => EmissionsRecord) public materialRecords;
    mapping(uint256 => JSONBlobRecord)  public jsonRecords;

    mapping(string  => ProjectSummary)  public projectSummaries;
    mapping(address => string[])        public userProjects;

    /* O(1) "have I pushed already?" helper –
       bytes32(key) → bool so we never iterate through userProjects */
    mapping(address => mapping(bytes32 => bool)) private _projectSeen;

    mapping(address => bool) public authorisedUploaders;

    uint256 public totalConcreteVolume;
    uint256 public totalCLTVolume;
    uint256 public totalSteelVolume;
    uint256 public totalEmissionsTracked;

    /* ────────────────  CONSTANTS  ──────────────────── */
    // Densities (kg/m³)
    uint256 private constant D_CONC  = 2400;
    uint256 private constant D_CLT   = 500;
    uint256 private constant D_STEEL = 7850;

    // Emission factors (kg CO₂e / kg) × 1e6
    uint256 private constant F_CONC_A1A3 = 120_000;
    uint256 private constant F_CONC_A4   =   5_000;
    uint256 private constant F_CONC_A5w  =   8_000;

    uint256 private constant F_CLT_A1A3  = 437_000;
    uint256 private constant F_CLT_A4    = 160_000;
    uint256 private constant F_CLT_A5w   =   7_000;

    uint256 private constant F_STEEL_A1A3 = 2_450_000;
    uint256 private constant F_STEEL_A4   =    32_000;
    uint256 private constant F_STEEL_A5w  =   250_000;

    /* ────────────────  EVENTS  ─────────────────────── */
    event MaterialEmissionsLogged(
        uint256 indexed id,
        address indexed user,
        string  indexed projectId,
        Material material,
        uint256 volume,
        uint256 totalKgCO2e
    );
    event EmissionsJSONLogged(
        uint256 indexed id,
        address indexed user,
        string  indexed projectId,
        string  jsonData
    );
    event UploaderAuthorised(address indexed uploader);
    event UploaderDeauthorised(address indexed uploader);

    /* ────────────────  MODIFIERS  ──────────────────── */
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    modifier onlyAuthorised() {
        if (!(msg.sender == owner || authorisedUploaders[msg.sender]))
            revert NotAuthorised();
        _;
    }

    /* ────────────────  CONSTRUCTOR  ────────────────── */
    constructor() {
        owner = msg.sender;
        authorisedUploaders[msg.sender] = true;
    }

    /* ───────────── PUBLIC API – JSON  ──────────────── */
    function storeEmissionData(
        string calldata jsonBlob,
        string calldata projectId
    ) external onlyAuthorised returns (uint256 id) {
        if (bytes(jsonBlob).length == 0) revert EmptyJSON();

        unchecked { ++jsonRecordCount; }
        id = jsonRecordCount;

        jsonRecords[id] = JSONBlobRecord({
            user: msg.sender,
            data: jsonBlob,
            timestamp: block.timestamp,
            projectId: projectId
        });

        if (bytes(projectId).length != 0) {
            _trackUserProject(msg.sender, projectId);
            projectSummaries[projectId].lastUpdated = block.timestamp;
        }
        emit EmissionsJSONLogged(id, msg.sender, projectId, jsonBlob);
    }

    /* ───────────── PUBLIC API – MATERIAL  ──────────── */
    function recordMaterialEmissions(
        Material material,
        uint256 scaledVolume,
        string calldata projectId
    ) external onlyAuthorised returns (uint256 id) {
        if (scaledVolume == 0) revert VolumeZero();

        (
            uint256 a1A3,
            uint256 a4,
            uint256 a5w,
            uint256 total
        ) = _calculate(material, scaledVolume);

        unchecked { ++materialRecordCount; }
        id = materialRecordCount;

        materialRecords[id] = EmissionsRecord({
            user: msg.sender,
            material: material,
            volume: scaledVolume,
            a1A3: a1A3,
            a4: a4,
            a5w: a5w,
            total: total,
            timestamp: block.timestamp,
            projectId: projectId
        });

        _updateGlobalStats(material, scaledVolume, total);

        if (bytes(projectId).length != 0) {
            _updateProjectSummary(projectId, material, scaledVolume, total);
            _trackUserProject(msg.sender, projectId);
        }

        emit MaterialEmissionsLogged(
            id, msg.sender, projectId, material, scaledVolume, total
        );
    }

    /* ───────────── ACCESS CONTROL  ─────────────────── */
    function authoriseUploader(address uploader) external onlyOwner {
        authorisedUploaders[uploader] = true;
        emit UploaderAuthorised(uploader);
    }
    function deauthoriseUploader(address uploader) external onlyOwner {
        authorisedUploaders[uploader] = false;
        emit UploaderDeauthorised(uploader);
    }
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        owner = newOwner;
        authorisedUploaders[newOwner] = true;
    }

    /* ───────────── VIEW HELPERS  ───────────────────── */
    function getUserProjects(address user)
        external view returns (string[] memory)
    { return userProjects[user]; }

    function getGlobalStats()
        external view
        returns (
            uint256 concreteVolume,
            uint256 cltVolume,
            uint256 steelVolume,
            uint256 totalEmissions
        )
    {
        return (
            totalConcreteVolume,
            totalCLTVolume,
            totalSteelVolume,
            totalEmissionsTracked
        );
    }

    function calculateEmissions(Material material, uint256 scaledVolume)
        external pure
        returns (uint256 a1A3, uint256 a4, uint256 a5w, uint256 total)
    { return _calculate(material, scaledVolume); }

    /* ───────────── INTERNAL – MATHS  ──────────────── */
    function _calculate(Material mat, uint256 scaledVol)
        internal pure
        returns (uint256 a1A3, uint256 a4, uint256 a5w, uint256 total)
    {
        (
            uint256 density,
            uint256 fA1A3,
            uint256 fA4,
            uint256 fA5w
        ) = _params(mat);

        uint256 massKg = (density * scaledVol) / 1e6;

        a1A3 = (massKg * fA1A3) / 1e6;
        a4   = (massKg * fA4)   / 1e6;
        a5w  = (massKg * fA5w)  / 1e6;
        total = a1A3 + a4 + a5w;
    }

    function _params(Material mat)
        private pure
        returns (
            uint256 density,
            uint256 fA1A3,
            uint256 fA4,
            uint256 fA5w
        )
    {
        if (mat == Material.Concrete)
            return (D_CONC, F_CONC_A1A3, F_CONC_A4, F_CONC_A5w);
        if (mat == Material.CLT)
            return (D_CLT,  F_CLT_A1A3, F_CLT_A4, F_CLT_A5w);
        return (D_STEEL, F_STEEL_A1A3, F_STEEL_A4, F_STEEL_A5w);
    }

    /* ───────────── INTERNAL – STATS  ──────────────── */
    function _updateGlobalStats(
        Material material,
        uint256 volume,
        uint256 emissions
    ) private {
        if (material == Material.Concrete) {
            totalConcreteVolume += volume;
        } else if (material == Material.CLT) {
            totalCLTVolume += volume;
        } else {
            totalSteelVolume += volume;
        }
        totalEmissionsTracked += emissions;
    }

    function _updateProjectSummary(
        string memory projectId,
        Material material,
        uint256 volume,
        uint256 emissions
    ) private {
        ProjectSummary storage s = projectSummaries[projectId];

        if (material == Material.Concrete) {
            s.totalConcrete += volume;
        } else if (material == Material.CLT) {
            s.totalCLT += volume;
        } else {
            s.totalSteel += volume;
        }
        s.totalEmissions += emissions;
        unchecked { ++s.recordCount; }
        s.lastUpdated = block.timestamp;
    }

    /* ───────────── INTERNAL – PROJECT LIST  ────────── */
    function _trackUserProject(address user, string memory projectId) private {
        bytes32 key = keccak256(bytes(projectId));
        if (_projectSeen[user][key]) return;              // O(1) check
        _projectSeen[user][key] = true;
        userProjects[user].push(projectId);
    }
}
