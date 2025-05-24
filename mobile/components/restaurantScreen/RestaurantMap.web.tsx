// import React, { useEffect, useRef } from 'react';
// import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { Branch } from '@/types/booking';

// interface RestaurantMapProps {
//   branches: Branch[];
//   restaurantName: string;
//   onClose?: () => void;
//   isPreview?: boolean;
// }

// // This is a web-specific implementation that uses Leaflet for web maps
// export function RestaurantMap({ branches, restaurantName, onClose, isPreview = false }: RestaurantMapProps) {
//   // Filter branches with valid coordinates
//   const validBranches = branches.filter(branch => branch.latitude && branch.longitude);
//   const mapRef = useRef<HTMLDivElement>(null);
//   const mapInstanceRef = useRef<any>(null);

//   if (validBranches.length === 0) {
//     return (
//       <View style={styles.container}>
//         <View style={styles.header}>
//           <Text style={styles.headerText} numberOfLines={1}>
//             Location
//           </Text>
//           {onClose && (
//             <TouchableOpacity onPress={onClose} style={styles.closeButton}>
//               <Ionicons name="close" size={24} color="#000" />
//             </TouchableOpacity>
//           )}
//         </View>
//         <View style={styles.noLocationContainer}>
//           <Ionicons name="location-outline" size={48} color="#ccc" />
//           <Text style={styles.noLocationText}>No location information available</Text>
//         </View>
//       </View>
//     );
//   }

//   // If in preview mode, show a simplified view
//   if (isPreview) {
//     const firstBranch = validBranches[0];
//     return (
//       <View style={styles.previewContainer}>
//         <View style={styles.previewContent}>
//           <Ionicons name="location-outline" size={20} color="#007AFF" style={styles.previewIcon} />
//           <View style={styles.previewTextContainer}>
//             <Text style={styles.previewAddress} numberOfLines={1}>
//               {firstBranch.address || 'View location'}
//             </Text>
//             {firstBranch.distance !== undefined && (
//               <Text style={styles.previewDistance}>
//                 {firstBranch.distance.toFixed(1)} km away
//               </Text>
//             )}
//           </View>
//           <Ionicons name="chevron-forward" size={20} color="#999" />
//         </View>
//       </View>
//     );
//   }

//   // Initialize Leaflet map when component mounts
//   useEffect(() => {
//     // Dynamically load Leaflet CSS
//     if (!document.getElementById('leaflet-css')) {
//       const link = document.createElement('link');
//       link.id = 'leaflet-css';
//       link.rel = 'stylesheet';
//       link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
//       link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
//       link.crossOrigin = '';
//       document.head.appendChild(link);
//     }

//     // Dynamically load Leaflet JS
//     const loadLeaflet = async () => {
//       if (!window.L) {
//         await new Promise<void>((resolve) => {
//           const script = document.createElement('script');
//           script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
//           script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
//           script.crossOrigin = '';
//           script.onload = () => resolve();
//           document.head.appendChild(script);
//         });
//       }

//       if (mapRef.current && window.L && validBranches.length > 0) {
//         // Clear previous map instance if it exists
//         if (mapInstanceRef.current) {
//           mapInstanceRef.current.remove();
//         }

//         // Initialize map
//         const L = window.L;
//         const map = L.map(mapRef.current).setView([0, 0], 13);
//         mapInstanceRef.current = map;

//         // Add tile layer (OpenStreetMap)
//         L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//           attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//         }).addTo(map);

//         // Create markers for each branch
//         const markers = validBranches.map(branch => {
//           const lat = parseFloat(branch.latitude || '0');
//           const lng = parseFloat(branch.longitude || '0');
          
//           if (isNaN(lat) || isNaN(lng)) return null;
          
//           const marker = L.marker([lat, lng]).addTo(map);
          
//           // Create popup content
//           let popupContent = `<b>${restaurantName}</b><br>${branch.address || ''}`;
//           if (branch.distance !== undefined) {
//             popupContent += `<br><small>${branch.distance.toFixed(1)} km away</small>`;
//           }
          
//           marker.bindPopup(popupContent);
//           return { lat, lng, marker };
//         }).filter(Boolean);

//         // If we have valid markers, fit bounds to show all markers
//         if (markers.length > 0) {
//           const bounds = L.latLngBounds(markers.map(m => [m!.lat, m!.lng]));
//           map.fitBounds(bounds, { padding: [50, 50] });
//         } else if (validBranches.length > 0) {
//           // Fallback to first branch if no valid markers
//           const firstBranch = validBranches[0];
//           const lat = parseFloat(firstBranch.latitude || '0');
//           const lng = parseFloat(firstBranch.longitude || '0');
//           if (!isNaN(lat) && !isNaN(lng)) {
//             map.setView([lat, lng], 13);
//           }
//         }
//       }
//     };

//     loadLeaflet();

//     // Cleanup function
//     return () => {
//       if (mapInstanceRef.current) {
//         mapInstanceRef.current.remove();
//         mapInstanceRef.current = null;
//       }
//     };
//   }, [validBranches, restaurantName]);

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.headerText} numberOfLines={1}>
//           {restaurantName ? `${restaurantName} Location` : 'Location'}
//         </Text>
//         {onClose && (
//           <TouchableOpacity onPress={onClose} style={styles.closeButton}>
//             <Ionicons name="close" size={24} color="#000" />
//           </TouchableOpacity>
//         )}
//       </View>
      
//       <View style={styles.mapContainer}>
//         <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
//       </View>
      
//       <View style={styles.branchesContainer}>
//         <Text style={styles.branchesTitle}>Locations:</Text>
//         {validBranches.map((branch, index) => (
//           <View key={`${branch.id}-${index}`} style={styles.branchItem}>
//             <Ionicons name="location" size={16} color="#B91C1C" style={styles.branchIcon} />
//             <View style={styles.branchDetails}>
//               <Text style={styles.branchAddress}>{branch.address}</Text>
//               {branch.city && <Text style={styles.branchCity}>{branch.city}</Text>}
//               {branch.distance !== undefined && (
//                 <Text style={styles.branchDistance}>{branch.distance.toFixed(1)} km away</Text>
//               )}
//             </View>
//           </View>
//         ))}
//       </View>
//     </View>
//   );
// }

// // Add global type for Leaflet
// declare global {
//   interface Window {
//     L: any;
//   }
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//     paddingTop: 20,
//   },
//   headerText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     flex: 1,
//     marginRight: 10,
//   },
//   closeButton: {
//     padding: 8,
//   },
//   noLocationContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   noLocationText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//   },
//   previewContainer: {
//     backgroundColor: '#f8f8f8',
//     borderRadius: 8,
//     overflow: 'hidden',
//     marginVertical: 8,
//   },
//   previewContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//   },
//   previewIcon: {
//     marginRight: 10,
//   },
//   previewTextContainer: {
//     flex: 1,
//   },
//   previewAddress: {
//     fontSize: 14,
//     color: '#333',
//   },
//   previewDistance: {
//     fontSize: 12,
//     color: '#666',
//     marginTop: 2,
//   },
//   mapContainer: {
//     flex: 1,
//     height: 300,
//     marginBottom: 16,
//   },
//   branchesContainer: {
//     width: '100%',
//     maxWidth: 500,
//     backgroundColor: '#f8f8f8',
//     borderRadius: 8,
//     padding: 16,
//     marginHorizontal: 'auto',
//     marginBottom: 16,
//   },
//   branchesTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 12,
//     color: '#333',
//   },
//   branchItem: {
//     flexDirection: 'row',
//     marginBottom: 16,
//     alignItems: 'flex-start',
//   },
//   branchIcon: {
//     marginRight: 10,
//     marginTop: 2,
//   },
//   branchDetails: {
//     flex: 1,
//   },
//   branchAddress: {
//     fontSize: 14,
//     color: '#333',
//   },
//   branchCity: {
//     fontSize: 14,
//     color: '#666',
//   },
//   branchDistance: {
//     fontSize: 12,
//     color: '#666',
//     marginTop: 4,
//   },
// });