import SwiftUI

struct ContentView: View {
    
    @State private var isScanning = false  // Tracks scanning state
    
    var body: some View {
        ZStack {
            // Embed the RoomPlan scanning ViewController
            ViewControllerWrapper(isScanning: $isScanning)
                .edgesIgnoringSafeArea(.all)
            
            VStack {
                Spacer()
                
                if isScanning {
                    Text("Scanning...")
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.black.opacity(0.7))
                        .cornerRadius(10)
                }
            }
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
