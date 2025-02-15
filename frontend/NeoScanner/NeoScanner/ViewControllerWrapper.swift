import SwiftUI

struct ViewControllerWrapper: UIViewControllerRepresentable {
    
    @Binding var isScanning: Bool  // State binding for UI updates
    
    func makeUIViewController(context: Context) -> ViewController {
        let viewController = ViewController()
        viewController.onScanStateChanged = { scanning in
            DispatchQueue.main.async {
                self.isScanning = scanning
            }
        }
        return viewController
    }
    
    func updateUIViewController(_ uiViewController: ViewController, context: Context) {
        // No updates needed yet
    }
}
