/* ===== Numeria Quest — Desain Rubah Baru (Rubah Ekor Sembilan) =====
   Dimuat PALING AKHIR (setelah naga.js dan arena.js).
   Rubah putih berekor sembilan dengan corak & ujung ekor api merah, dibuat dari gambar referensi:
   tiap frame berukuran 96x128 piksel (rasio 3:4), sudah diberi garis tepi gelap 1 piksel.
   Frame: 0 = diam, 1 = bernapas (dibuat otomatis dari frame 0), 2 = menyerang (pose "ATTACK", saat mendarat),
   3 = melompat (pose "JUMP / AIR ATTACK"). Serangan jarak dekat rubah = LOMPAT: melesat naik, menukik, lalu mendarat
   tepat saat damage mengenai pemain (diatur dari an.lg milik script.js, tanpa mengubah script.js).
   Yang terpengaruh: Rubah Pecah-Pecah ("fox") dan Rubah Roh Bulan ("spiritfox", versi perak-biru).
   Macan Tutul (tiger) tidak ikut berubah: ia tetap memakai gambar rubah lama.
   Rubah digambar langsung dari file ini lewat pembungkus spr(), jadi tidak butuh naga.js untuk ukuran sprite.
   Ubah angka di bawah untuk mengatur ukuran:
   - BATTLE_H : tinggi rubah di battle per satuan skala musuh (s). 72 -> musuh s=3 setinggi 216 px
   - WORLD_SC : ukuran di dunia dibanding kotak lama 16 petak (1 = sama seperti dulu, 2.4 = sekitar 1,6x tinggi pemain)
   - FRAME_SC : pembesaran per frame (frame serangan diperbesar karena posenya lebih rendah & lebar)
   - JUMP_H   : tinggi lompat (pecahan dari tinggi rubah; 0.22 = sekitar seperlima badan; jangan terlalu besar agar tidak terpotong di atas layar). JUMP_DX: jarak maju saat lompat (px, 0 = lompat di tempat)
   - JUMP_AIR : bagian animasi serangan yang dihabiskan di udara (0.55 = mendarat saat damage mengenai pemain) */
(function () {
  const BATTLE_H = 72,
    WORLD_SC = 2.4,
    FRAME_SC = [1, 1, 1.3, 1.15],
    JUMP_H = 0.22,
    JUMP_DX = 26,
    JUMP_AIR = 0.55;
  const PAL0 = {
    A: "#fdf1e7",
    B: "#fceee6",
    C: "#f9e7df",
    D: "#f6ded6",
    E: "#f1d9d3",
    F: "#f0d2cd",
    G: "#e7cdcb",
    H: "#e4c4c4",
    I: "#e7bbb9",
    J: "#d6b9c0",
    L: "#cfb1bc",
    M: "#e6a3a1",
    N: "#c8a9b6",
    O: "#bd9eaf",
    P: "#ec8179",
    Q: "#ba8999",
    R: "#f75e48",
    S: "#d65e5d",
    T: "#ab8ca2",
    U: "#a17e96",
    V: "#956f87",
    W: "#8d5d70",
    X: "#e84239",
    Y: "#d53c3b",
    Z: "#ce2e30",
    a: "#cf1919",
    b: "#b63039",
    c: "#b4181d",
    d: "#a2212c",
    e: "#551e26",
    K: "#2a101e",
  };
  const F0 = [
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "......................................................KKKKK.....................................",
    "...................................................KKKbZZZZK....................................",
    ".................................................KKZYYXZbZZcK...................................",
    "................................................KbYXXYbdKKKK....................................",
    "..............................................KKZXRXZddK........................................",
    ".............................................KbZXRXZddK.........................................",
    "............................................KZXRRXYZddK.........................................",
    "...........................................KbYRRRYYbddK.........................................",
    "..........................................KdZRRRXZZdddK.........................................",
    "...........................KKKKK.........KdZRRRRYYZdddK.........................................",
    "..........................KYXXZbK........KbXRRRPSXYdddK.........................................",
    "........................KKZXXZKK........KbZRRRIBMXZbdddK........................................",
    ".......................KZYXXZK..........KZXRRIBBRXYZPbdK........................................",
    ".......................KXRRZK...........KZRPRABARXXZMMddK.......................................",
    ".....................KKXRRXcK..........KbXMMRBBAPXXXZHQddK............KKKKK.....................",
    "....................KdYRRRYbK..........KbMMCRBBBDPXXPFHSdK.........KKKZZZZZK....................",
    "...................KbZRRRRZbK..........KSEBAIBBBBIRICEGLbdK......KKZYXXZZKK.....................",
    "...................KbXRXRXZbK..........KSECABBBBBRPBCMIGQbK.....KZYXXYbbK.......................",
    "..................KdZRXXRXZbK..........KSECBBBBBDXIBDYYIJQUK...KZXXXXbdK........................",
    "..................KdYRXRRXZZdK.........KQGCBBBBADRPBCIYMHNTK..KZXXRXZdK.........................",
    "..................KcYXXRRXZZbbK.........KJECBBBBBFXPDIYMHNOK.KZXXRXYbdK.........................",
    ".................KdbYXXRRRZXZSbK........KNGDBBBBBBIYPSSGHNOK.KYXPRXbddK.........................",
    ".................KdbXIRRRRXXYQOTKKK......KJEDBBBBBCMYYMGHLNTKZXPFXXbddK.........................",
    ".................KdbPBSXRRXPXYIJNOTKK....KOHEDBBBCDDIYHGJNNTbYRFCXXZbdK.........................",
    ".................KdbHBIXRRXMMYPFHJNTTK....KNGEDCCBCDEPMHJNNQbXMBBPXYZddK.......KKKK.............",
    ".................KbSEBDSXRRFBIXMIIHLNTK....KNGEEEDBCEHSJLNNbYRBBBMXXYbdK......KYXXXKKK..........",
    ".............K....KQFCBIXRMBBBFMPMGJLNOK....KLFEEEDCEFPONNQbXMBBDRXXYZbTK......KZXXXXZKK........",
    "............KbK...KOHCBBMXPBAABFIEGGHLLOK....KJFEEEEFFMONNVZPCBAIXPCMXZOTK......KKYXRXYZK.......",
    "...........KYK....KQHDBBBPXDAAIXYPFGGJLLOK...KOHEEEEGHGJNNVYFBBBDRDBCIYSNTK......KZXRRXXZK......",
    "..........KXXK....KQNFCBBCPSDAIISZPGGGLNNOK..KOLFEEEEJHJNNVYCBBBDPBCHEIbLOUK......KZXRRXZZK.....",
    ".........KZRXK.....KOHECBBBMPFBCMYZMGGHLLNK...KOHEEEEHJJNNVYCBBBDPBFSIESLNTK......KZXRRYZZZK....",
    "........KbXRXZK.....KOHDCBBCFFCDPPSZIGGJLLOK..KOLFEEEELLLNVMCBBBBPPBMXDILLOTK......KXXRRbbZK....",
    "........KZXRXZK.....KTNGEDCDDDDDDEGPPGGHLLNK..KOLJEEFGLLLOVJDBBBBDPSXXDFLLLTK......KXXRRdddcK...",
    ".......KdZZRRXZKK....KKOJGEDDDDDCDEEHLLHHLLNK.KTNLHEGLLLLOVJDCBBBBBPXXMDHLLOK.....KZXXRRddddK...",
    ".......KbZZRRXXZbK.....KOLHGFEEEEEEEFGLLHLLQLKKTNLJEGLLLLOUWDCCCBBBCIXPDGLLNTK...KZXXPRXddddK...",
    ".......KZZZRRRXXZZK.....KOOLJGFFEEGEEGGLLLLVIQKTNLLGJLLLNTTWLDCDCBBBCPSIEJLLTK..KYXRMCRXbdddK...",
    ".......KZZZXRRRXXXZKK....KKKNJHFEEFJFGJLLLLSIGKTNNLHLLLLOTTWJDDDDDCBCFYMDJLLTK.KYXRIBCXZbddddK..",
    ".......KZZZXRRRRPPXYMKK.....KOLJGEEGJFGLLLOSBJKTONLLLLLNTTTWHEDDEDDCCDMMDJLNOKKIMIBBCMXZbddddK..",
    ".......KZZYXXRRRMAIMCFNKK....KTOJHEEJJGLLLSMBOWTONLLLLNOTTUKKGDDHDDDDDIMELLOOKDBBBBDPXYPMddddK..",
    "......KbbZPMXXXXRAGSDACJNKKK..KKNLHDJLJLLQYDMOVTONLNNNOTTTUK.KDDJEEDDDGFFLNOTGBBBBAPRPMGJbdbbK..",
    "......KVbZPCCPXXMBHYSABBFNOOKK.KTNLHJLLLNYMDbOWTTOLOOOTTTUK..KEFLHHDDFHFJNOTTBBBBDXMBCEFHSdQbK..",
    "......KUbSFFDCIFBBGSMMAABGLNOTK.KOLLLLLNSPDMbOWTTONTTTTTTVK..KEJNJHDDHHHNNOUGBBABPPCCSPGGSbQK...",
    "......KTSYHMSDBBBBGdEQDBBBFLLNTKKTNLLLLSSDDbbOWTTTTTTTTTUK...KJNLJHDEHHLNOTJBBBBDXABMSbMISNOK...",
    "......KTLSSIYMCCBBHdWEQDABBGLLNTKKTNLNQGCBQdWVUTTTTTUTTTVK..KTLOJHHDGHJNOTTCBBBBFRDBCMbMLOLTK...",
    ".......KNIPZZDDDCCIddMGQDABCHLLOTKTONQGABEddUWTTTTTUUTUVK...KTOLHHHGHHNOTUHBDBBBBMSDESbMLLNTK...",
    ".......KOJHPYMDDDDIbdWBFNLDBDJLLOUUTQEBBBQedTWTTTUUUUUUK..KKTOOJHHHHHJOOTTCEEBBBBDXSSZSINNOK....",
    "........KNHGMSMDDDFbddJBDJOGCGJLOOVUDBBABUdWOWTTTUUUUUVKKKTONONJHHHHHNOOVJDGECBBCFXZbSIHNNTK....",
    "........KOLHGGPPIEEQbdWCBCFNNLOOTTVDBBBBHedTNWTTUUUUUUKKONHHJNJJHHHHLOOTUEGGFCCCDDFYYHHLNOTK....",
    ".........KOLJHGGHJHVbddNBBBELQUUQOJABAADQdbTOVTUUUUUVKKLHHHHLNJJLHHLOOTVLFGGECDDDDIZMHJNOTK.....",
    "..........KOLLJJHJJQbbdeDAACENTLGFCCBACOWdWNWTUUUVVVONHHHHHJOJJLNHLOOTUVGGGGEDDDDGSSHJNNTTK.....",
    ".....KKK..KTONJHJJJLdbWeNABBEHJECCCFCCEFQdQJWUVVVVWQHHHHHHJONJLONNOOOUVLGGGGEEFGHSPHJNNOTK......",
    "....KZZZK..KKTONLLOOWbbJWFBCGFCBABCGDDCNdbNQWVVVVWNHHHHHHJOONNOOOOOTTVOGGGGGGGGGMJJLNOOTK.......",
    "....KYYK.....KKTTTTOUdbWDCCFEBICAAADEEHQWQLWUVVWWOHHHHHHLOOOOOOOTTUUVQHGGGGHJJJJLSSSSTUK........",
    "...KZRYK.......KKKUUTWbbQDDEBMIBAAAADGHJOJHLWWVWJHHHHHLNOOOOOTTTUUVUOHHJHGJLNNNNNNWZYbbK........",
    "...KYRYK..........KKKKWQJHDBAPFDAAAABCFGHJTUOUWOJHHHJNOOOOOTUUUUUWVLGHJLHJNNNNNOOTUbXXYZKK......",
    "..KZYRYK............KQNGJFCIBPFRAACMABCDFNTTUWWNLJJJNOOOOOTUUUUVVHHHHJNNLNNNNOTTTUUKZXRXZdK.....",
    "..KbYRXZK...........KUUJGCMCMFFRAAIMBBAIEFJTVWVONLNOOOTTTUUVVVULGFFHJNNNNNOONTTTUKK.KXRRXbdK....",
    "..KZZXXZZKKKKK.KKKKKKOHGDBPFMSPPBDRIBAIMDDEGHHQTNNONOUUUUUWUQFDDEEGJNNNNNTTOTTUUK...KYRRXZddK...",
    "..KZZXRXYZZZZSKTOOTUWJNQFBIPBISFBPMBCMSFDCABCNWUOOOOUUUUVWLCBCDDEJLNNNNOTTTTUUUK....KXRRRXZdK...",
    "..KZZXRRXYYYXIGJJNNOTVWLPFBMBSIBAMCNeQDCBBDGGBNVTTOTUVUVWGCCCDEGLNNNNOTTTTUUUUK....KZXRRXXZddK..",
    ".KbZYYRRRXXXXPDEHJNNOUQDHWJCBRBAAGWeeHDBBEGNUVHQUTTUVVVWGCDFHHHLNNNNOTTTTUUUUK.....KXRRRXXZddK..",
    ".KbZFSXRRRMDPXMDEHLNNUJDHUeQAPBBDWbZQFSCBCGHJVWQVTTUVVWJEEHJLLONNNNOTUUUUUUKK.....KXXRRXPSZZdK..",
    "..KZFDSXRPCACPPDDEJNNUDULMbbLDBBOdXPISDBBADJEGOWVUUVVWUFGHJNOOOONOTUVVVKKKK....KKKXRPPRXMPZbddK.",
    "..KPEBDSXXPPBDRPDEJNNWVVLQPPQBBBSMBFPFCCDEGGFCEGOVUVVWHHJLOOTTTTTVUOOOLBBKKK..KFMPPMBPXREISdddK.",
    "..KOGCBCPPPMCDMXIHLNNOTWQLQHSABDPBBCEGHEGDCGLBBGUWVVWWHJLOTTUUUVVGEBBBBBBCDFKKEAAABBMXXMEHSdddK.",
    "..KTJEBBBCDIFEISSJNNNLOTWWUQIABCEADQTOEBEGCBDDCCGOWVWUJLOTTUVVWLBBBBBBBBBBBBBBBBBBBCRRMDEHSdddK.",
    "...KOHFCCDMZSEEPPNNNNOOTWUOUNBABBGUONHGCCLDABCDGEELVWTNOTTVVWVGCCCCCCBBBBBCDDBBBBBAPPBBDHJNddK..",
    "...KTLHEDDSSHEMYONNNOTWWJHNTOUTBEUTJGEDFCNDABDCCHJDUWUOTTUVWVJEDDDDDDDCDCDDDBBBBBAISCBIMILOdWK..",
    "....KTLHFFMYMMZQNNNOTTWDJUTNUeOFUTJGCBBHELCBBCDCETOGWUTTUVWUJHGGGEDDBCDDDCCCBBBBBBSPAIXYQLVbTK..",
    ".....KOLJHGMSSMJNNOTTUWNWWJJNUVVTJGCBBDHJHBCBBDFDGUQQWTUVVWLJJJJHGEDDCCCDCCBCBBBBFXDCSYbQNbVTK..",
    "......KONLJJLLLNOOTTUVWVWNFFHOOOLGCBBBFGJDBMAAFOLFTLFOWVVWQJJJJLNJJGDDDDDDDCDDCCDFXFEMQbQQWTTK..",
    ".......KTTONNNOTTTUUVWWWOCFDGLNJECBBBDEGDBBMMAGLHNOGDDGVWWJJJLOTTONJJEDDCCDDDDDDDDPSHNbbNQTTK...",
    "........KKKTTTUUUKKKKVUUCJGDJHJGBDBBCECEBBCIbCHHEGHDDDDHUWJJNTTTTTONJJFDDDDDDDDDDFIbPbbONTTTK...",
    "...........KKKKKK..KULWHOJBGFEHDECBBCDABBCFSdHHHDPFDDCBCHWNNTVVWVUTONJJGGFDDDDEGHJJbdbOLOTTK....",
    "...........KbK.....KNWWJWGEGBEFEGCBBECBBBFMYSPLGMYFDDDAACLVUVWWOTWWVONJJJJHHHHHJJJQbSONOTTTK....",
    "..........KKbK....KWWWWWVDLCBCCHDBBDEBBCCHSIDSNIYSEDDDCABEQWWUNNNOVWVTOLJJJJJJJNNSbQLNOTTTK.....",
    ".........KdZbK...KbWUTVUULLBDBCGBBBGCBCGDMMFISISYEEFEDCABEJWUONNNNNTVVTONJJJJJNQQQQLNTTTTK......",
    ".........KbYbK..KbUOOTTUWWGBGBDGBBCGCEFTNJDPMIEYPDGLEDCBABHNWTNNNNNNOVWVONLJJJJJLLNOTTTUK.......",
    ".........KZXZK.KbYLJLOTUWVNCHBEGBAFGEJGUODMRFBCYDFOLFDBBABIPQVTOONNLJNTVWUOONLNNOOTTTTKK........",
    "........KdZRXZKKZSFGHLOTUTWELEFHBBGGFNJTEFXMABBMGNTJHEBAABFSJWTTTNNHFFHNUWVUTTTTTTKKKK..........",
    "........KdZRRYZZYXSHGJOTTTWNUGHJBCHHFHONBPPBABBDNUNLLDBDDBPSHUWTTONLGEEGLOWKKKKKKK..KdK.........",
    "........KdbXRRXXXPIFFLNTTUeWVHJHCDHJGFJNBXDPSDBEUTOTLCAFPMYPFJWUTTTNJEEEEGNSK.......KdK.........",
    "........KddZXRRRMABCHSNTTUeWWHLHFEHHJHGLBXDPSPBGWTWUGCBAPXSDDJWVTTOOLHEECDGLSKK....KZZdK........",
    "........KddSSXRFBAFISNOTTUWWVNOJJGHLNNJNDPMCSPBLWWVTHDBCRSCBCHOWUTONNLGECBBDHSYK..KKZZdK........",
    ".........KdNIYYPDPYSQNOTTVKVNVWONJHJONOOEFSPYFCVWWVOJEAMXIBCCGOWVTTNNNLGECBBBCMPKKYRXZddK.......",
    ".........KdQNJQYZbSNNOTTVK.KQOUWTTHJOTTTHBCSSBCHJWVTLFCPPBDXSENWVUTTONLJEECBBBBCRXPFRZddK.......",
    "..........KbONNOQQNNOTUVK..KQNTVWWJOJTTUNCBPEBCDHOWTLGCPPBMYYPHWVVTTTNNJFFDCBBBAABAMXZddK.......",
    "..........KdbOONNNOTTVKK....KOOTUVWWQTVTUEBIAABBEQVWNJDMSDIDSSDQVVTTTONLGEDCBBBABAFXXYddK.......",
    "...........KdbVTTTUVKK......KQLOTVVVWQWUWNDCCAABCNWWQJFDPSDFXSCLWVUTTONNJFDDCCIPMFRXRSddK.......",
    "............KKbbWWKK........KQJOTTVVVWWWWWHEBAACHDWWULHECMYSZICFUKVTTNNNLGEDDMXXXXXRISdK........",
    "..............KKKK..........KQJOTTUVVWVVWWOEBABCQLWVWOLHEDMYPCCEJKVUTNNNNJGEIXMDFPPFJSdK........",
    "............................KLJLTTUVWWWVVWODABBCNUWVKULLJGESICDDHKKUTONNNNJGMXCIDDEHNddK........",
    "............................KHHLOTVVWKKVVWNBBBBEHWWVKKOLLJHPMGGDGTKKUONOONLHMYISSGJNSddK........",
    "............................KMHLNTVVK..KVWNABBIEHVWVK.KLLLLNLHHEFNK.KTOOTNNNJQSSbJNQdddK........",
    "...........................KQPGJOTUK....KWLBBCPFNWVVK.KTOLLJJHHHGLK..KTTTTQSQQbbQNObVbK.........",
    "...........................KPSGGTTUK.....KLCBISGVWVVVK.KKOOLJHHHHHOK..KUUTTVbbbQNOQTUK..........",
    "...........................KPSGJTTUK.....KNCDRFHWVVVVWK..KKKOLJHHHLK...KVVUTOOOOTTTUVK..........",
    "..........................KYSMGNTUK......KNDRPCNVVVVVVVK....KTOJHHGOK...KKVVVUUUUUVKK...........",
    "..........................KPSMMOVWK......KNRXEFUKKVVVVVK.....KTOJHHMK.....KKKVVVKKK.............",
    "..........................KISSSWbK.......KOXMIGWK.KVVVWK......KTNHJPNK.......KKK................",
    "..........................KISYZbK........KMRMSMK..KVVVK........KOHJbNK..........................",
    "..........................KMXZZdK.......KbPXPPSK..KUVWK........KOHJZQK..........................",
    ".........................KZRXZZbK.......KbXXIMSK..KUbWK.........KJJZQK..........................",
    ".........................KZXZZZK........KZXXPPK..KbbdbK.........KQPZQNK.........................",
    "........................KbXXZZZbK.......KXXXXbK..KbZddK..........KYZSJK.........................",
    "........................KZXZZbZZK.......KZXXZdK.KbZddK...........KZZZQK.........................",
    "........................KXXZZKKbK.......KZXXZZKKbZbdddK..........KbZZZbK........................",
    ".......................KZXZZZK.K........KXXZbZKdddddddK..........KdcZXZK........................",
    "....................KKKZYZXZK..........KbXXZbKddddddKK...........KddZXZbK.......................",
    "...................KbZbZZZZZK..........KZXXZKKdedKddK............KdbZXZZK.......................",
    "..................KdZdZbbZZbK.........KKYXZZK.KKKKdK.............KZZYYbZK.......................",
    "..................KdddZdZZZK........KKZZXYYZK.....K.............KZYbXbZbK.......................",
    "..................KdKdddbZK........KbYbYYbXZK...................KZbZZbZZK.......................",
    "...................KKdKddK.........KZbbZdXZcK...................KdKbKKbKcK......................",
    ".....................K.KK..........KbdZdKZZK....................KdKdKKdKK.......................",
    "...................................KdKcdKccK.....................K.K..K.........................",
    "....................................KKdKdKK.....................................................",
    "......................................K.K.......................................................",
  ];
  const F2 = [
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "................................................................................................",
    "..........................................................KKKKK.................................",
    ".......................................................KKKaccccK................................",
    "....................................................KKKcaZZZbdddK...............................",
    ".................................................KKKcZYXXYZddKKK...KKKK.........................",
    "...............................................KKccZXRRXZbdcaK...KKccccKK.......................",
    "..............................................KcdZXRRXYZddcKK..KKcZXRRXZcK......................",
    "...............................KK...........KKcSSXRRRYZdddaK..KcZXRRRRRRXZK.....................",
    "..............................KccK........KKacMIXRRRPPZddcK..KcYRRPRRRXYZZZK....................",
    "............................KKZcK........KccSMDPXRICESbddK.KKbYPFBPRRXYbbdZZK...................",
    "...........................KcZZK........KaaVHFBERMBCELdbdKKPSSIBBIRRXXbbdccccK..................",
    "..................K.......KaZYaK.......KcbbGDCBDRFBPPHbVdKKQIIBBDRPPPMbdcKKccK..................",
    ".................KcK.....KaZXZaK......KaZbQEBCBCRMCFSHSObKSGCBBBPMABDPdcK..KcK..................",
    "................KKcK.....KcXXbcK......KaXbGDCBBBDSSPbHNOVbGCBBBBMBDPEQdcK...K...................",
    "...............KccaK....KcZRXZdK......KZYUECDCBBBEPZMHNOWQCBBBBBIBEPIQScK......KKKKK............",
    "..............KaPcK.....KaXRXYbdKK...KdYSOEDECBCDEGSQJOTUDCBBBBBDMIYISOdK..KKKKaacaZK...........",
    "..............KZcK.....KaZXRRXYbQYKKKKdSOLEGECCEFGJQQLTWHCEBBBBBFZYIHNOcKKKccZXXXRRZcK..........",
    "...............KK......KcZXRRXHSSJOVcKWQTLEGEEEFHHLQOOUQEFDBBBCDPbHFJNQKKcZXRRRRRRXbdK..........",
    "...............KK......KdZRRRRCDMPHLObVTVLFHDEGHJLLOOUVGGHCBCDEMSbHJNOWccYXRRPPRRXZdbZK.........",
    "..............KaaK....KadYISRMBCDHMGLOWUWLGJEGHLLNOOUWJGHFDDEFIPSQJNOUVPMFFFCIRRXZbddZaK........",
    ".............KcaK......KdPEDPMBBFPHGHLTWWNJLGHLLNOTUVOHGHEEGJNIMWJNOVOMCBBBBDPRRZbdccZaK........",
    "............KaZaK.....KcbPSFCPCBMPSGGLNUWOLJJLNNOTUVTJHGHGJQMFESQNOVNCCBBBDPRRXXZbdKKaaK........",
    "............KXZK.......KSSYHCFPEMYbMGLNTWTLLJNOOTUVULHGLLQbPDIQWOTVLBBBABFRPIPPIbbcK.KcK........",
    "...........KaRK........KSJMPIDEEFGMSHJNOWUNNLTOTUWUNLJNQQYIFXYdTUVLBBBBABPIABCDMbbcK.KcK........",
    ".......K...KZXK.........KNGGIFEEEGGMLGNNUWONOTTTWVTTOTQFSIDSZdWUVJBCBBBACRCDSHEMddcK..K.........",
    "......KcK..KRZK.........KSLGGHFGGHJHNLNOUWONTUVVUQLLTHBMFCSSQWVVGCDDBBBABPCFMSESbSK.........K...",
    ".....KcacKKZRcK..........KQLJLJHHHNJLNNOVWTOUVTCCEHOEBCEBMMNQWUHEEEBBBBBEPMESMMSLYK........KaK..",
    ".....KaSK.KRXaK...........KUONLJHHLNNONTVVTUVNCBFJOFBBCEHLOVWOGEEEDBCBBBBPXYSHQLNZK........KaaK.",
    ".....KcKKKcPXK.........KKKKcWUONLJJOOOOTWVUVJDDGJTHDDEGJNTWULGEEEDCDCCCCDSMIEJLLSK.........KaaK.",
    ".....KcKaKXPaK........KabMJNTUWVQNLOOTTUWVVJEDGJTHFGGHNOVVNHFGFEEEEEEDDMSPDFJLNWK.....K...KccK..",
    "....K.K.KaPPZK...K...KaSFEFGJNTbSQOOTTUVWVTGFJNTLHJWOTVUJHGGJJGHHHHGHGGIFGHLLObK.....KcK..KaSK..",
    "...KcK..KZPRcK..KZK..KcPBCEFHLOWXSVTJUUVWWNJJNTUJNSYVTNJGHJJLLLLJHHHJGGGHJLNQbK.....KacK..KXIaK.",
    "...KaK.KKZMRaK.KMSKK.KaMFBBEGJOSbQPVUEHUVWTNOTVTUSSbULJJLLJJLLLLLLNLNLLLNNTWKK....KKcZK....KPXK.",
    "..KcaKKacXIXcK..KYYaKKZSSCFJHHOSZdCJVJDBJTTOTUWQPMbbONNNOOOOOOONOOTVVVTTUWbK....KKcZZcK....KZaK.",
    "..KaaKKaZRIZYKK.KSPYKKbDSPHJLLNQSdQCDQQGDGJTUWNBBWdSOOTOOOOOTOTUVUOGHGLUbZcKKKKKcZXZcK.....KacK.",
    "..KZaKKaZPIYPZaKKcMSZcPPPHGJLNNVMbdDBDUQEBGTWHBBJdYUTUTTUTTUUVVODBBBCCIRXXYYbZZYXXYcK.......KK..",
    ".KaXcKKcZMDYRSaKKaMaacSSSGLNNOTVIXdUBBEOBDBFNBABWYMVUUUUUUVVWUFDCBBBBAIFMRRRXRRRXZdcK...........",
    ".KZXdKacXMBSXXaK.KXaKKdHMJNNOOUUQPSVEBBGBIDCCBBQbSNWVVWWWWWVHEECBBBBAFIBAFPRRRRYbdcK...K........",
    ".KaXcKaXXIAMYXaK.KcZK.KQJNOTVUVVWMbNGBBHCMCBBBDObIQVWWVVWVNGEECBBBBCRRRPPRRRRYZbdcK...KcK.......",
    ".KaXaKaXRIAFZXZK.KKaK..KVTUWWWVTTOSOGCIDFFMABCGQPJWeeWVVOJGEEDCCBBBPREFPRRRXZbddcK....KcK.......",
    "..KXZbYXRIAASRXKKcKaK...KddKKKWOTWOHCBMCPDMECFBGJQOVVTONLJJHFDDCBBCSIFMDPYSSbddcK....KcZK.......",
    "..KYSYRYPIAAMSRaKcKK.....KK..KWQUJGGDBMIMMMCIFABJVOHUTONLLJHGEEEDDCMMFSIHJQbbdcK....KKZZK.......",
    "..KZPZPYMMAABXMXZcaK........KSSOOLHNQEDPCCIBPCCIBLOCGUUTOONJHHGEFGGMZSbLQSbdWdKKKKKKcZXZK.......",
    ".KacMYYYPEAAAPIXYXaK.......KdSMOOEDGWWGECMDHFFSFBCOGDMUVUTOOLJHHHMQYSSNNQVbWUVbdccacZXXcK.......",
    ".KaaPMcZPAAAAADPZcXaK....KKbWNJOVOJEMbWHCPCDQeIBBDOGBMMWWWWWTONLJJNLLOUWWUTOQbbbbZYXRRZcK.......",
    "..KaXAPZXAAAAAADXcSaK...KJSSIVTOVOGGPMSWGIDVSPMBEQNEIIPHWWWVWWWVVVVVWWTOOLJJJLPYXXRRRZbK........",
    "..KaZDBMRCAFAAAAIYYScK..KEPPPWWVUWUJLMEQGAEQIMFDQTDBFPICLWWWVUUTTTOOLJJHGFEDDDCCPRRRYbcK........",
    "...KaPIAIMAPFAAAAFYPcK.KYMPRRbWVWWWWUOHGDBFFCHNVTJFCBRCPSLWKSVUTONLJHFEDCDFPRIFPRRXYbbK.........",
    "...KaRYCADAPPFAADAIPPaK.KSRRXZddKdeTOUVHCAADUVVTOLGECSIFIPHbSKWUOOJJJHFECFRMMRRRRRXbbcK.........",
    "....KacSCAAIMXIADIAIDYK.KZXXbZcK.KKWQOVOLOEUUOLTTTNJFHSMPPBNQKKWTONHJJJHFMPCIESYSMYbcK..........",
    "....KcZYSAAFPXXFAPMACIbKKcZbZdK....KbQVVQVOUONHWUWVNJHGIPPBCJKKKbVTLMJHPMMSISIFGJSbcK...........",
    ".....KYZcSAARPZXIEXPAAMcKKccdK......KbdWbbWOJULWbcKbTNJJJMPCDbYKKKbQMNJJQYZYYIJNSdcK............",
    "......KKaZPAPKKcXMPcPBAMcKKKK........KKbQVbbQWbbaZKKcWTUQEDCEJSK..KccbSMJHIMJLOUSKK.............",
    "........KZZPCZKKcZPYcZMAHZKK...........KKKKKKKKKKZacaKKWDACMEGQK...KKcZXbbWbbbdKK...............",
    ".........KcZPPcKKKaXYZZSFCScK....................KKKaccPMPPDGNVK.KK..KKaRRZKKZK.................",
    ".........KaKaSYK..KKaZYcZPCIZKK....K...............KKKZRMICFONSZKaaK...KZRPXcRaK................",
    "..........K.KcXZKK..KaaaKcZPMSaKKKKZKK............KacZRIPFIQWbbYZKKaKK.KaXMDPXRK.K..............",
    ".............KcacaK..KKKaXZccYSSaaKKSSKK.........KaZXXXPPSQdedYYZZaKZZKKKKSSCIPSKcK.............",
    "..............KaacaK....KKaaKKcZYZaaaZacK........KZbZYRZbcKKKKaZddcKKaRaccKaRACMacK.............",
    "...............KKKK.......KK..KKKaaaaaKK.........KddcdccKK....KKcccZZKcPPaaZXMAAMPZK............",
    ".................................KKKKK............KKKKKK.......KcaZXRPSXPIPRRMFAEMSaK...........",
    "................................................................KKKZZXPFIFAAFBAAAPSaK...........",
    "...................................................................KKKaXaaYPIIAAACXK............",
    "......................................................................KKacKKaZYYPIFZK...........",
    "........................................................................KK..KZaccaZSaK..........",
    "............................................................................KXXaKKaaaaK.........",
    ".............................................................................KKK..KKKK..........",
  ];
  const F3 = [
    "................................................................................................",
    "...................................KKKKKK.......................................................",
    "................................KKKaccdccKK.....................................................",
    "...............................KccZXYbdddcaK....................................................",
    "..............................KaYRRYbddaaaaK....................................................",
    ".............................KaXRRXbdcKKKKK.....................................................",
    "............................KaXRRXXbdK..................KKKKKKKKK...............................",
    "...........................KaXRRRRYbcK.................KccZYYZdccK..............................",
    "..........................KcXRRMPRYbbK...............KKcYRRXbdccK...............................",
    ".........................KcZRRIBPRXbbdK.............KcYRRRXZdcKK................................",
    ".........................KcYRMBBPRXZbScK...........KaXRRRXZddK..................................",
    "........................KcZPRCBBHRRYbSbcKKK.......KcYRPPRXbdcK..................................",
    "........................KdPIPBBBIMRXPIHWdaaK.....KcZRMDPRYddcK..................................",
    ".......................KcSGDMBBBCIRPBCFHQWSSK...KcbXIBDRRYbddK..................................",
    ".......................KdQECCBBBBIRIBCSMFNOSZK.KabPMBBBPRXbddK..................................",
    ".......................KbJECCBBBBDRPCBDSMGJNSKKabLPCABCPRXZdbK..................................",
    ".......................KbHECCBBBBBDPSMFYMEGJObKbQEDBBAIRXPFSScK.................................",
    "......................KQbHEECCBBBBBBFPYZMEEJLUKWGDCBBBFRPCBESdSK................................",
    ".............KK.......KSQLGEDDBBBBBBCCEMSMGGJNWWGDBBBBFRFABCHbSK....KKKKKK......................",
    "............KacK......KaQNHEEECCCBBBCEDCESHJJNTWGDBBBBCPIBFMCQWOK..KccdccaK.....................",
    "............KcaK.......KSTJHFEECCEEDCCCEEFMJLLTWGECBBBBIPBCPMMQVK...KcdbddcK....................",
    "............KZcK........KQOJGEEEEDEEEDDDGGFHJLOWJECBBBBBPPFPPHLWK....KcbbddcK...................",
    "...........KcXcK........KQTLJHFEEEEEEEEEEGJGJJOVOGEBCBBBCMXXIFLUK...KacbZbddcK..................",
    "...........KYRdK.........KbTLJJHFEFEEEEEEEFJJJOVTHECCBBBBDDPPFLObK..KabYYYdddaK.................",
    "..........KaXRZcKK........KWUNLJJHHJGFFEEEFHLJOTWLGEDDBBBCDFYGLOWK..KaZXRXbddaK.................",
    "..........KaYRRZdcKKKKKKKKKKdWTOLLJLJHHGFEGJJJNTWTHEEEEDBDEESMLLWKKKcZYRRXZdddK.................",
    "..........KaZRRXYZccccYabWWWWddVTOLNLJJJJGEJJJNOVWLGEFEEDDEFPHLLWKaabYRRPXZdddK.................",
    "..........KcZXRRXYZbbYONNHHJLTVWWWTOOLLLJJGJJLOOUWOJFFHEEEEGFGLNdZQbYRPMDYbdddK.................",
    "...........KZYRRRRXXYYPDBCDEFGJLOWWUTTOLJJJJLNOOTWVLHEHHEEEHFHLObOMSDBBEHZddbdK.................",
    "...........KbZXRPRRRRRXPIACDFEGJLNTWVTOOLJJLNNOOUVeOJGJJEEGJHJNOWLIDBBCDPbdSSdK.................",
    "...........KdbYXRCIMPPDBBBCEFHJLLLUWdWTOONJLOOOTUVeULJJJFEJJJLOUUGEBBBCPYYMJQbK.................",
    "...........KcSZYSDDCBBBBBCDEEEHLNWbbddVTOONNOOTTUVeVNJJJGGJLLNTWNFDBBBBYSIILQSK.................",
    "............KSPZPFPMDCCBBDEEEEEHVbXddUWVTOOOOTTTUWeVOJJJHJJNNOUWJFCBBBAXMISSOSK.................",
    "............KZNSbIFZIFEDDEEFJJJQSXRZbUVWUOOOOTTUUWeUOJJJJJLNOTVOGFCBBBCSPGMSObK.................",
    ".............KQJPbYYIEEEEEGJLLLQSRPXbWUWVUTOOUTUVeeTNJJJJJONOUWLFFCBBCDGYPbOWK..................",
    "..............KQLJMSYMHIEHJJLNUOZMAISHUWWVUTOUUUVeWOOJJNJOOOUWTHFECDDDEGSbOObK..................",
    "...............KSQJHHMPHHJLOOTUPMFSDFIQQUVVUTUUVWeVOOJNOOOTTVVLFFDEEEEFHbMNVK...................",
    "................KbSTONLLNOTUVVVMMBPFISDCDEJWUUVVeWTOLNOOOTUVWNJFEFFFFGJPSNTbK...................",
    ".................KKKbWVWWWWWdeNHYPPDDCDDCEHNWUVWeWbWQNTTUUVWOJHGFGJHJJNQNTWK....................",
    "....................KKKKKKKKKdJHSIBCBCDEFEJLVVVWWPRRFFGTUUTVNJGHJJJJJLNNTUcK....................",
    "..........................KKcdJMPCCCDEEEFGJNTWWNCFRXYSGEFHUTNNLLLJJLNOOOVcK......K..............",
    ".........................KacddJMFDEEFFEEEJLOUWNDCRRbddWTVVTOTUVVVUTUTTTWKK......KaK.............",
    "........................KcXXZdJGEEEFFGFEFLNTVWEBIRXddWVVUVVVUQLHGJOTVWWKK.......KccK............",
    "........................KddXbdOGFEEGJHHFGJNULJBCMXXbdVVVVUOJHEEEEEDDGNVWcK......KccK............",
    "........................KeYZddUJGGHLNJHFJLTNHCBCFRYbdWWUONJHGGGFEEDCBCEJQbKKKK..KcZcK...........",
    "........................KcdddKWNLJLONJHGLOUCCBBCPXYMbWTONNNNLLJJHHGECBBBDQdccaKKcbbcK...........",
    ".........................KcKKKdTONOVONHHNUHBBBBBSXIEbbOONNNNNLJHFFFFECBBBESYbdcbZYbdK...........",
    "..........................K...KbUUVWTNJLOODBBBBBRMDEMdVTTUTTTOLJHEEEECBBBAFRXYYYXZdcK...........",
    "...............................KKKdWTNNNVEBBBBBBSMMSMSWUUTTTONNLJHGEEDCBBABCMPRXXbdcK...........",
    ".................................KdbUNNOUDBBBBBBMSDSMLWUUTTTTTONJJHEEEEMRRMBEPXYZddcK...........",
    ".................................KbWVOOTOCBBBBBCEPSSFLWVUUUUUUUTOJJGEEIYPMRPXXYZdddK............",
    "................................KbZbVOTTJCCBBABDEISFGJVVVVUUUUUUTOLJGFPPCCDRYZbbddcK............",
    "................................KbZdVOVJFCDBBBCEEMMEHLWWWWVVUUUTTTOQQJSPESFISSQSddK.............",
    "..................K.............KZYdVTVHECDBBBFFFPFFJNWLLOVWWVUUTTTOQYYbMYPHJQbbdK..............",
    ".................KaK...........KcXYdWUUGDBECCCFFEEEGJTUHFEFHOWWVVUTTTONQSSNOQVVVK...............",
    ".................KRK...........KXRYdWVNFFCECDDEEEFHJOWLJHFEEEHVVWVVUTTTOOOTTUVWK................",
    "................KZFZK.........KZYXZdeWJEGCCCEEFGHJJNUVOONJFECCGUdKWbWWVUVVVVQVK.................",
    "................KaPaK......KK.KbbYYbeVJEECBBDEHGLLLOWTNLJJHGDBCGSKKKKKdWWWQKKK..................",
    ".................KYaK.....KcSKKdbbbddQJGCDABCEJJNOOWVUUOJJJGFDBCNcK...KKKKK.....................",
    "..................KK......KZSK.KdedKWQJGCGDBCEFNOTWWVUUOOLJFEEBBGbK.............................",
    ".........................KSXPK..KKKKVOJECJDECHFJOVWVVUUTONJHEFDBDOK.....K.......................",
    ".........................KZXSK.....KbNJGGGBDGHLJOWKdWVUUONJJEHMBCNcK...KcK......................",
    "..........................KYcK.....KbOLNEGBBDCOOTWKKddUUTOJJGESCBMdK...KdcK.....................",
    "...................K......KXZK......KTOQDCAABDDHUVKKZbVUUTLJJESPDMdKK.KKdcK.....................",
    "..................KaK....KKSYK......KWVJBBBBBBAGHWecXdeVUTOJJIZSPFbdcKacddK.....................",
    "..................KZK...KaaRSK......KdQDBBBBBBBCFOdSbbeWUTONQNSEPFPZdcddbdK.....................",
    "..................KPaK..KaaRPaK..K.KdWHDCBBBBCDCGTMIdYWWWUTOOPSIIRPXZbbZbdK.....................",
    "..................KaK...KYXRMcK.KcKKWNHFDBCBBCJDOEBHdYWVSWVTOSbMSPXXYYZbdcK.....................",
    "...................K....KXXRFZK.KZZcdTNFEECBBCJUJBBQbPWWUSWUOLQbSMZZbbdddcK.....................",
    "........................KXRRASaKKdYSdWTJHJDAABHUDBBWbMVWKKKWUONOJHPbbdddcaK.....................",
    "........................KZIMAIZKKcdSMMUVOODBCBDGBBDWbFWK...KdVTNLOOOQdddKK......................",
    "........................KaIBBASKKcbdNCCJUVDAIAABBBHLSEeK....KcWTTTTVWdcK.K......................",
    "........................KaRFAMScKKbbdEBCGOFBIABBBACJQOWK.....KKbWVWWbKK.KaK.....................",
    ".........................KZPAMZaKKbPdWFBBHEIFIBABABCGQWK.......KKKKKK...KaK.....................",
    ".........................KZXBMdaK.KQbVQCGHGMFIMAMCBBBGQWK................K......................",
    ".........................KccMCacK.KbQbQJJMHMFBRBPDAFACCQK...............KcK.....................",
    "..........................KcXAYK...KWQULJQMISIMDPBJMBCOeK...............KcK.....................",
    "...........................KaISK...KdUNLJHSMIMBDIGWFDEOdK..............KZcK.....................",
    "............................KXPK..KbULLNQJLPCPCBEWSPCLVQK.............KcScK.....................",
    "............................KaMK...KWOJJQWULEMMETSMSGQVTK.............KXMaK.....................",
    ".............................KSZK...KdQJHNSWQJMGWMILUVVQK.............KYYK......................",
    ".............................KZRK...KeWNJMPPWQGBPCHVWTSUK............KKYK.......................",
    "..............................KRK....KKdUNOMHMEBFEWVTQSQK...........KSKaK.......................",
    "..............................KZaK....KdUVVUNJFCAHeVQbMbK...........KaKK........................",
    "...............................KXK.....KWOUVWNGFGOeVbPHbK...........KZK.........................",
    "...............................KZZK....KWLOUVVNKOWKWbSQbK.....K....KZK..........................",
    "................................KaK.....KTNTUVWWWKddXMVK.....KaK...KRK..........................",
    ".................................K......KWJNOUWKKKdZXYdK.....KaK...KRK..........................",
    ".............................K..........KdHNTTVeKddYYdcK....KZK...KXZK..........................",
    "............................KaK.........KQNLOTTWdbbbbdK....KcRcK..KRaK..........................",
    "............................KaK.........KSNJJLNVedbbdcK....KYSaK.KXRK...........................",
    ".............................KaK.........KLHGGLTedbddcK....KMRK..KPZK...........................",
    ".............................KaK.........KQJIFGNWddddK....KZScK.KXPcK...........................",
    ".............................KZaK........KdQMEEHQdKKK.....KSZKcKaRXcK...........................",
    ".............................KZXK.........KWSECFNbK.......KXXcKaRRbcK...........................",
    "..............................KRK.........KZQPCCGSK.......KYRZcXRScaK...........................",
    "..............................KPYKK........KSSMCGQK........KaYZRMbaK............................",
    "..............................KXPccK........KOSMIQSK.......KZRRMPdZK............................",
    "..............................KXFZaK........KSMPPSdK......KaPRMDXcaK............................",
    "..............................KaFMXK.........KQSMZdK......KaDDAIZaK.............................",
    "..............................KXBMRaK........KbSMXdaK.....KXAAAMZcKK............................",
    "..............................KZMbYYK.........KbRRZdK....KaPPAAPcKKaK...........................",
    "...............................KSYKZK.........KcZRYdaK...KZSPBFXZaXaK...........................",
    "...............................KaPKK....K......KbXYbdK...KaYRAFSXRXK............................",
    "................................KXK....KaK.....KdYYZddK.KcKcMAMFMRaK............................",
    "................................KXZK...KacK....KdZYbbeK..KKaDABDMaK.............................",
    ".......................K........KaZK...KaZK....KcZYYbcK...KSAAMSRaK.............................",
    "......................KaK........KaK...KaPaK...KcbYYbdK..KPMAScZaK..............................",
    "......................KZaK........K....KZDXK...KcdYdbdK..KPBMcKXK...............................",
    "......................KaXZK............KaPaK....KeddddK.KYPDZKKcK...............................",
    "......................KaRRaK........K...KZaK.....KcccK..KaMYcK.K................................",
    ".......................KXRRcK......KcK...KK.......KKK...KXPaK.......K...........................",
    ".......................KaXPRYKK....KaK..................KPXK......KKaK..........................",
    "........................KaRPRSSK...KcZK................KYSaK.....KaXK...........................",
    ".........................KXPMRSXK..KaRK......K.........KRaK.....KZRaK...........................",
    "...............KKK.......KaXIMRRXK.KZMXK....KaK.......KZZaK....KXRZK............................",
    "..............KcaZK......KKXPAIRRaK.KXSK....KaK.......KZKK..KKKXPZaK....KK......................",
    "...............KcacK....KZMPXIAMXRK..KZK....KRK......KcK...KaaRPYaaK..KKacK.....................",
    "................KKccKKK..KXRXPCBPZaK.KXK....KXK.....KXcK..KYYRIRaKKKKKccaK......................",
    "................KaacZZaKKKaRPRMABSccKcKZK...KcK.....KaKaKKSXPDRZYKKZdcccK.......................",
    ".................KaKcXRXPKKXPFICACSZKKZK....KcK......KaKKaYMAMXbRcXbdcKK........................",
    "..................K.KaRPPXXZXMAAAAAMaKYcK....K....K.KSacZPDACXZZXPZcKK..........................",
    "..................KKKKcXMCMSRRIAAAAAMZaXK........KcKSPZSFAAAMPMIMccK.KKK........................",
    ".................KaZcccZYMMDBIFDAFDAACPSSKK....KKZaMDPFAADCBAAFSccaaKcacK.......................",
    "..................KacaPRPPCPPMFAAAPPIDADAXcKK.KcXSFAAAFMMCADMSSMYSYYZZXK........................",
    "...................KKcccZRPMXZZXRMIRRRRMMDPYaKaYMFMPSYYXIMPYZXFMPYcKKKK.........................",
    ".....................KKaYacaaccKaaaZaccaaaaZZcYZaaZccccZZacccZZaaXaK............................",
    ".......................KKKKKKKK.KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.............................",
  ];
  // lama (16x16) hanya dipakai sebagai cadangan data; penggambaran memakai sprite 96x128
  const SMALL = [
    "................",
    ".KK........KK.K.",
    ".KCK...KKKKKFIK.",
    ".KCCKKKLLLLKFFIK",
    "KCPCCCKLLELKFFFK",
    "KCCCCCCKLLKOQFFK",
    ".KKCCDCCKKKOQOFK",
    "..KCDVDCCCKOOQFK",
    "..KCTDTCCCCOQOK.",
    "..KCCTCCCCCQOQK.",
    "..KCCCCCCCCOOK..",
    "..KKCCKKCCCKK...",
    "...KCK.KCKKK....",
    "..KUUK.KUUK.....",
    "..KKKK.KKKK.....",
    "................",
  ];

  const toHsl = (h) => {
    const r = parseInt(h.slice(1, 3), 16) / 255,
      g = parseInt(h.slice(3, 5), 16) / 255,
      b = parseInt(h.slice(5, 7), 16) / 255,
      mx = Math.max(r, g, b),
      mn = Math.min(r, g, b),
      l = (mx + mn) / 2,
      d = mx - mn;
    let H = 0,
      S = 0;
    if (d) {
      S = d / (1 - Math.abs(2 * l - 1));
      H =
        mx === r
          ? ((g - b) / d + 6) % 6
          : mx === g
            ? (b - r) / d + 2
            : (r - g) / d + 4;
      H *= 60;
    }
    return [H, S, l];
  };
  const toHex = (H, S, l) => {
    const c = (1 - Math.abs(2 * l - 1)) * S,
      x = c * (1 - Math.abs(((H / 60) % 2) - 1)),
      m = l - c / 2;
    const [r, g, b] =
      H < 60
        ? [c, x, 0]
        : H < 120
          ? [x, c, 0]
          : H < 180
            ? [0, c, x]
            : H < 240
              ? [0, x, c]
              : H < 300
                ? [x, 0, c]
                : [c, 0, x];
    return (
      "#" +
      [r, g, b]
        .map((v) =>
          Math.round((v + m) * 255)
            .toString(16)
            .padStart(2, "0"),
        )
        .join("")
    );
  };
  // rubah roh bulan: api merah -> biru es, bulu putih sedikit kebiruan; garis tepi tetap
  const iceShade = () => {
    const o = {};
    for (const key in PAL0) {
      if (key === "K") {
        o[key] = PAL0[key];
        continue;
      }
      let [h, s, l] = toHsl(PAL0[key]);
      if (h < 30 || h > 300) h = s > 0.35 ? 200 : 215; // merah/merah muda -> biru
      s = Math.min(1, s * (l > 0.8 ? 1.2 : 1.05));
      o[key] = toHex(h, s, Math.max(0.04, Math.min(0.97, l + 0.02)));
    }
    return o;
  };
  const P1 = PAL0,
    P2 = iceShade();

  /* ---------- frame animasi ---------- */
  const first = F0.findIndex((r) => /[^.]/.test(r)),
    LEG = 96; // kaki tidak ikut bernapas
  const F1 = F0.slice();
  for (let r = first; r <= LEG - 2; r++) F1[r] = F0[r + 1];
  const FR = [F0, F1, F2]; // frame yang dipakai game (SP.foxL.a)
  const ALL = [F0, F1, F2, F3];

  /* ---------- gambar ke kanvas kecil (di-cache), lalu cukup 1x drawImage per frame ---------- */
  const cache = new Map();
  const cvOf = (rows, pal, white) => {
    const key = (pal === P2 ? "i" : "n") + (white ? "w" : "n"),
      id = rows;
    let sub = cache.get(id);
    if (!sub) cache.set(id, (sub = {}));
    if (sub[key]) return sub[key];
    const c = document.createElement("canvas");
    c.width = 96;
    c.height = 128;
    const g = c.getContext("2d");
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === ".") continue;
        g.fillStyle = pal[ch];
        g.fillRect(i, j, 1, 1);
      }
    });
    if (white) {
      g.globalCompositeOperation = "source-in"; // kilat putih saat terkena / aba-aba serangan
      g.fillStyle = "#fff";
      g.fillRect(0, 0, 96, 128);
    }
    return (sub[key] = c);
  };

  const put = (k, p) => {
    SP[k] = { p, m: SMALL, a: [SMALL, SMALL, SMALL] };
    SP[k + "L"] = { p, m: F0, a: FR, hs: 1, sc: 1 };
  };
  put("fox", P1);
  put("spiritfox", P2);
  const KIND = {
    fox: { pal: P1, big: false },
    foxL: { pal: P1, big: true },
    spiritfox: { pal: P2, big: false },
    spiritfoxL: { pal: P2, big: true },
  };

  /* ---------- pembungkus spr(): rubah digambar dari sprite 96x128 ---------- */
  const _spr = spr;
  spr = function (k, x, y, s, al = 1, tint, fr = 0, fl = 0, mm) {
    const kd = KIND[k];
    if (!kd) return _spr(k, x, y, s, al, tint, fr, fl, mm);
    let idx = 0,
      H,
      W,
      X,
      Y;
    if (kd.big) {
      // battle: kotak lama 32*s, kaki rubah menapak di dasar kotak, badan di tengah kotak
      idx = Math.max(0, FR.indexOf(mm));
      const bw = 32 * s,
        H0 = BATTLE_H * s;
      let dx = 0,
        up = 0;
      // serangan jarak dekat (an.lg: 18 -> 0): lompat maju di udara, mendarat saat damage mengenai pemain
      if (idx === 2 && typeof an !== "undefined" && an.lg > 0 && !(an.rc > 0)) {
        const p = 1 - an.lg / 18;
        if (p < JUMP_AIR) {
          const u = p / JUMP_AIR;
          idx = 3;
          up = Math.sin(u * Math.PI) * JUMP_H * H0;
          dx = -JUMP_DX * u * u * (3 - 2 * u);
        } else dx = -JUMP_DX * (1 - (p - JUMP_AIR) / (1 - JUMP_AIR));
      }
      H = H0 * FRAME_SC[idx];
      W = H * 0.75;
      X = x + bw / 2 - W / 2 + dx;
      Y = y + bw - H - up;
    } else {
      // dunia: kotak lama 16*s, diperbesar WORLD_SC kali; kaki di dasar kotak, sedikit naik saat melangkah
      H = 16 * s * WORLD_SC;
      W = H * 0.75;
      X = x + 8 * s - W / 2;
      Y = y + 15 * s - H - (fr ? Math.round(s * 0.5) : 0);
    }
    X = Math.round(X);
    Y = Math.round(Y);
    W = Math.round(W);
    H = Math.round(H);
    const sm = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = al;
    ctx.save();
    if (fl) {
      ctx.translate(X + W / 2, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(X + W / 2), 0);
    }
    ctx.drawImage(cvOf(ALL[idx], kd.pal, !!tint), X, Y, W, H);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = sm;
  };
})();
