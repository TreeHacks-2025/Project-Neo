import UIKit
import RealityKit
import RoomPlan
import Firebase
import FirebaseStorage
import FirebaseFirestore


class ViewController: UIViewController {
    
    var arView: ARView!
    private var roomCaptureView: RoomCaptureView?
    private let roomCaptureSessionConfig = RoomCaptureSession.Configuration()
    private var isScanning = false
    
    var onScanStateChanged: ((Bool) -> Void)?  // Callback to update SwiftUI state
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Set up ARView
        arView = ARView(frame: view.bounds)
        arView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(arView)
        
        // Set up RoomCaptureView
        roomCaptureView = RoomCaptureView(frame: view.bounds)
        roomCaptureView?.delegate = self
        view.insertSubview(roomCaptureView!, at: 0)
        
        // Add Scan Button
        let scanButton = UIButton(type: .system)
        scanButton.frame = CGRect(x: 20, y: 50, width: 150, height: 40)
        scanButton.setTitle("Start Scan", for: .normal)
        scanButton.backgroundColor = .systemBlue
        scanButton.setTitleColor(.white, for: .normal)
        scanButton.layer.cornerRadius = 8
        scanButton.addTarget(self, action: #selector(toggleScan), for: .touchUpInside)
        view.addSubview(scanButton)
    }
    
    @objc func toggleScan(_ sender: UIButton) {
        if isScanning {
            stopSession()
            sender.setTitle("Start Scan", for: .normal)
            sender.backgroundColor = .systemBlue
        } else {
            startSession()
            sender.setTitle("Stop Scan", for: .normal)
            sender.backgroundColor = .systemRed
        }
        isScanning.toggle()
        onScanStateChanged?(isScanning)  // Notify SwiftUI about scan state change
    }

    func startSession() {
        roomCaptureView?.captureSession.run(configuration: roomCaptureSessionConfig)
    }
    
    func stopSession() {
        roomCaptureView?.captureSession.stop()
    }
}

// MARK: - RoomCaptureViewDelegate
extension ViewController: RoomCaptureViewDelegate {
    
    func captureView(shouldPresent roomDataForProcessing: CapturedRoomData, error: Error?) -> Bool {
        return true
    }
    
    func captureView(didPresent processedResult: CapturedRoom, error: Error?) {
        if let error = error {
            print("Processing Error: \(error.localizedDescription)")
            return
        }
        
        do {
            let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
            let exportURL = directory.appendingPathComponent("scannedRoom.usdz")
            try processedResult.export(to: exportURL)
            
            // ✅ Upload to Firebase Storage
            uploadToFirebase(fileURL: exportURL)
            
            // ✅ Share/Save the model locally
            let shareVC = UIActivityViewController(activityItems: [exportURL], applicationActivities: nil)
            present(shareVC, animated: true)
        } catch {
            print("Export Error: \(error.localizedDescription)")
        }
    }
    
    // ✅ Upload File to Firebase Storage
    func uploadToFirebase(fileURL: URL) {
        let storageRef = Storage.storage().reference()
        let fileRef = storageRef.child("roomScans/\(UUID().uuidString).usdz")
        
        fileRef.putFile(from: fileURL, metadata: nil) { metadata, error in
            if let error = error {
                print("Upload Error: \(error.localizedDescription)")
                return
            }
            
            // ✅ Get the download URL after successful upload
            fileRef.downloadURL { url, error in
                if let error = error {
                    print("Download URL Error: \(error.localizedDescription)")
                    return
                }
                
                if let downloadURL = url {
                    print("File uploaded successfully: \(downloadURL)")
                    self.saveFileInfoToFirestore(downloadURL: downloadURL.absoluteString)
                }
            }
        }
    }

    // ✅ Save File Info to Firestore
    func saveFileInfoToFirestore(downloadURL: String) {
        let db = Firestore.firestore()
        let docRef = db.collection("roomScans").document()

        let data: [String: Any] = [
            "fileURL": downloadURL,
            "uploadedAt": Timestamp(date: Date())
        ]

        docRef.setData(data) { error in
            if let error = error {
                print("Error saving file info: \(error.localizedDescription)")
            } else {
                print("File metadata successfully saved to Firestore.")
            }
        }
    }
}
