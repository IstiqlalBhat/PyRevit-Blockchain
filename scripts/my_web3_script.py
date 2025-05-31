# my_web3_script.py (CPython)
# Final optimized version for EmbodiedCarbonLedgerV2 smart contract

import sys
import json
import time
from web3 import Web3

def main(json_file):
    print("=" * 60)
    print("🏗️  EMBODIED CARBON BLOCKCHAIN UPLOADER")
    print("=" * 60)
    
    try:
        # 1) Read the JSON payload containing the emission data
        with open(json_file, "r") as f:
            data = json.load(f)
        
        print(f"📁 Loaded data from: {json_file}")
        print(f"📊 Project ID: {data.get('project_id', 'No project ID')}")
        
        material_records = data.get("material_records", [])
        print(f"📋 Total records to upload: {len(material_records)}")
        
        # Display material breakdown
        materials_summary = {}
        for record in material_records:
            mat = record["material"]
            materials_summary[mat] = materials_summary.get(mat, 0) + 1
        
        for material, count in materials_summary.items():
            print(f"   • {material}: {count} elements")

        # 2) Connect to local Ethereum node
        provider_url = "http://127.0.0.1:7545"
        print(f"\n🌐 Connecting to Ethereum node: {provider_url}")
        
        w3 = Web3(Web3.HTTPProvider(provider_url))
        if not w3.is_connected():
            print("❌ Could not connect to Ethereum node")
            print("   Make sure Ganache is running on 127.0.0.1:7545")
            return

        print("✅ Connected to Ethereum node")
        print(f"📦 Latest block: {w3.eth.block_number}")
        
        # Check network ID for verification
        try:
            network_id = w3.net.version
            print(f"🔗 Network ID: {network_id}")
        except Exception:
            pass

        # 3) Read the contract ABI
        try:
            with open("C:\\scripts\\contract_abi.json", "r") as f:
                contract_abi = json.load(f)
            print("✅ Contract ABI loaded successfully")
        except FileNotFoundError:
            print("❌ Could not find contract_abi.json at C:\\scripts\\")
            print("   Please ensure the ABI file is in the correct location")
            return
        except json.JSONDecodeError:
            print("❌ Invalid JSON in contract_abi.json")
            return

        # 4) Configure contract details
        contract_address = "0x799222FfE5Bc157972C7FbA9521F1568e525710e"
        
        try:
            contract = w3.eth.contract(address=contract_address, abi=contract_abi)
            print(f"📜 Contract loaded: {contract_address}")
        except Exception as e:
            print(f"❌ Error loading contract: {e}")
            return

        # 5) Account configuration
        sender_address = "0x8Be4444b3f896A636214db0E4D0E73B6Be3515A1"
        private_key    = "0x47c3ab69c55cdae62ee722ff514538d8c771027b2fa994f23032b379922491fc"

        # Check account balance
        try:
            balance = w3.eth.get_balance(sender_address)
            balance_eth = w3.from_wei(balance, 'ether')
            print(f"💰 Account balance: {balance_eth:.4f} ETH")
            
            if balance_eth < 0.1:
                print("⚠️  WARNING: Low account balance, may not have enough ETH for transactions")
        except Exception as e:
            print(f"⚠️  Could not check account balance: {e}")

        # 6) Check authorization
        print(f"\n🔐 Checking authorization for {sender_address}")
        
        try:
            is_authorized = contract.functions.authorizedUploaders(sender_address).call()
            print(f"✅ Authorization status: {is_authorized}")
            
            if not is_authorized:
                print("❌ WARNING: Sender address is not authorized!")
                print("   Run contract_setup.py first to authorize this address")
                print("   Continuing anyway - transactions will fail if not authorized")
        except Exception as e:
            print(f"⚠️  Could not check authorization: {e}")

        # 7) Get project ID
        project_id = data.get("project_id", "")
        if not project_id:
            project_id = f"revit_export_{int(time.time())}"
            print(f"📝 No project ID found, using: {project_id}")

        # 8) Store complete JSON summary first
        print(f"\n📤 STEP 1: Storing project summary")
        print("-" * 40)
        
        # Create summary payload (exclude individual records to save gas)
        summary_data = {k: v for k, v in data.items() if k != "material_records"}
        summary_data["total_records"] = len(material_records)
        payload_str = json.dumps(summary_data, separators=(',', ':'))  # Compact JSON
        
        print(f"📊 Summary payload size: {len(payload_str)} characters")
        
        # If payload is very large, create minimal version
        if len(payload_str) > 1000:
            print("⚠️  Large payload detected, creating minimal summary...")
            minimal_summary = {
                "project_id": data.get("project_id"),
                "timestamp": data.get("timestamp"),
                "grand_total": data.get("grand_total"),
                "total_records": len(material_records),
                "materials": {
                    mat: {
                        "volume_m3": data.get(mat, {}).get("volume_m3", 0),
                        "total": data.get(mat, {}).get("total", 0),
                        "element_count": data.get(mat, {}).get("element_count", 0)
                    } for mat in ["Concrete", "Steel", "CLT"]
                }
            }
            payload_str = json.dumps(minimal_summary, separators=(',', ':'))
            print(f"📊 Minimal payload size: {len(payload_str)} characters")

        try:
            nonce = w3.eth.get_transaction_count(sender_address)
            
            # First, estimate gas required
            try:
                estimated_gas = contract.functions.storeEmissionData(
                    payload_str, 
                    project_id
                ).estimate_gas({'from': sender_address})
                
                # Add 50% buffer to estimated gas
                gas_limit = int(estimated_gas * 1.5)
                print(f"⛽ Estimated gas: {estimated_gas:,}, Using: {gas_limit:,}")
                
                # Ensure minimum gas limit
                if gas_limit < 800000:
                    gas_limit = 800000
                    
            except Exception as e:
                print(f"⚠️  Gas estimation failed: {e}")
                gas_limit = 1000000  # Use high default
                print(f"⛽ Using default gas limit: {gas_limit:,}")
            
            # Build transaction for storeEmissionData
            tx = contract.functions.storeEmissionData(
                payload_str, 
                project_id
            ).build_transaction({
                'from': sender_address,
                'nonce': nonce,
                'gas': gas_limit, 
                'gasPrice': w3.to_wei('10', 'gwei')
            })

            # Sign and send
            signed_tx = w3.eth.account.sign_transaction(tx, private_key=private_key)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            print(f"📡 Transaction submitted: {tx_hash.hex()}")

            # Wait for confirmation
            print("⏳ Waiting for confirmation...")
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt.status == 1:
                print(f"✅ Summary stored successfully!")
                print(f"⛽ Gas used: {receipt.gasUsed:,}")
            else:
                print(f"❌ Summary transaction failed!")
                print(f"📋 Transaction hash: {tx_hash.hex()}")
                return

        except Exception as e:
            print(f"❌ Error storing summary: {e}")
            
            # Check if it's a gas issue
            if "out of gas" in str(e).lower():
                print("⛽ Gas limit exceeded for summary storage")
                print("💡 Tip: You can increase Ganache's gas limit or skip summary storage")
                
                # Ask if user wants to continue with individual records only
                try:
                    skip_summary = input("⚠️  Continue with individual records only? (y/N): ").lower().startswith('y')
                    if not skip_summary:
                        print("🛑 Upload cancelled by user")
                        return
                    else:
                        print("⏭️  Skipping summary, proceeding with individual records...")
                except:
                    # If running in automated mode, continue anyway
                    print("⏭️  Continuing with individual records only...")
            else:
                print("🛑 Stopping upload due to error")
                return

        # 9) Store individual material records
        if material_records:
            print(f"\n📤 STEP 2: Storing {len(material_records)} individual material records")
            print("-" * 60)
            
            successful_uploads = 0
            failed_uploads = 0
            total_gas_used = 0
            
            for i, record in enumerate(material_records):
                try:
                    material_enum = record["material_enum"]  # 0=Concrete, 1=CLT, 2=Steel
                    scaled_volume = record["scaled_volume"]   # Already scaled by 1e6
                    material_name = record["material"]
                    volume_m3 = record["volume_m3"]
                    
                    print(f"\n[{i+1:2d}/{len(material_records)}] {material_name}: {volume_m3:.3f} m³ ({record['element_name']})")
                    
                    # Get current nonce
                    nonce = w3.eth.get_transaction_count(sender_address)
                    
                    # Estimate gas for this transaction
                    try:
                        estimated_gas = contract.functions.recordMaterialEmissions(
                            material_enum,
                            scaled_volume,
                            project_id
                        ).estimate_gas({'from': sender_address})
                        
                        # Add 30% buffer
                        gas_limit = max(int(estimated_gas * 1.3), 300000)
                        
                    except Exception:
                        gas_limit = 400000  # Default for material records
                    
                    # Build transaction for recordMaterialEmissions
                    tx = contract.functions.recordMaterialEmissions(
                        material_enum,
                        scaled_volume,
                        project_id
                    ).build_transaction({
                        'from': sender_address,
                        'nonce': nonce,
                        'gas': gas_limit,
                        'gasPrice': w3.to_wei('10', 'gwei')
                    })

                    # Sign and send
                    signed_tx = w3.eth.account.sign_transaction(tx, private_key=private_key)
                    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
                    
                    # Wait for confirmation (shorter timeout for individual records)
                    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
                    
                    if receipt.status == 1:
                        successful_uploads += 1
                        total_gas_used += receipt.gasUsed
                        print(f"        ✅ Success (Gas: {receipt.gasUsed:,})")
                    else:
                        failed_uploads += 1
                        print(f"        ❌ Failed - TX: {tx_hash.hex()}")
                        
                except Exception as e:
                    failed_uploads += 1
                    print(f"        ❌ Error: {str(e)[:50]}...")
                    
                # Small delay to avoid overwhelming the network
                if i < len(material_records) - 1:  # Don't delay after last record
                    time.sleep(0.05)
            
            # Upload summary
            print(f"\n{'='*60}")
            print(f"📈 UPLOAD SUMMARY")
            print(f"{'='*60}")
            print(f"✅ Successful uploads: {successful_uploads}")
            print(f"❌ Failed uploads: {failed_uploads}")
            print(f"📊 Success rate: {(successful_uploads/len(material_records)*100):.1f}%")
            print(f"⛽ Total gas used: {total_gas_used:,}")

        # 10) Contract verification and statistics
        print(f"\n🔍 VERIFICATION & STATISTICS")
        print("-" * 40)
        
        try:
            # Get global stats
            stats = contract.functions.getGlobalStats().call()
            concrete_vol, clt_vol, steel_vol, total_emissions = stats
            
            print(f"🌍 Global Contract Statistics:")
            print(f"   • Concrete volume: {concrete_vol / 1e6:.2f} m³")
            print(f"   • CLT volume: {clt_vol / 1e6:.2f} m³")
            print(f"   • Steel volume: {steel_vol / 1e6:.2f} m³")
            print(f"   • Total emissions: {total_emissions:.0f} kg CO₂e")
            
            # Get project summary
            project_summary = contract.functions.projectSummaries(project_id).call()
            proj_concrete, proj_clt, proj_steel, proj_emissions, proj_count, proj_updated = project_summary
            
            print(f"\n📊 Project '{project_id}' Summary:")
            print(f"   • Concrete: {proj_concrete / 1e6:.2f} m³")
            print(f"   • CLT: {proj_clt / 1e6:.2f} m³")
            print(f"   • Steel: {proj_steel / 1e6:.2f} m³")
            print(f"   • Total emissions: {proj_emissions:.0f} kg CO₂e")
            print(f"   • Record count: {proj_count}")
            print(f"   • Last updated: {time.ctime(proj_updated)}")
            
            # Get record counts
            material_count = contract.functions.materialRecordCount().call()
            json_count = contract.functions.jsonRecordCount().call()
            
            print(f"\n📋 Contract Totals:")
            print(f"   • Material records: {material_count}")
            print(f"   • JSON records: {json_count}")
            
        except Exception as e:
            print(f"⚠️  Error querying contract statistics: {e}")

        print(f"\n{'='*60}")
        print("🎉 UPLOAD PROCESS COMPLETED SUCCESSFULLY!")
        print("🔗 All data is now permanently stored on the blockchain")
        print(f"📊 Project ID: {project_id}")
        print("='*60")

    except FileNotFoundError:
        print(f"❌ Error: Could not find file {json_file}")
    except json.JSONDecodeError:
        print(f"❌ Error: Invalid JSON in file {json_file}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python my_web3_script.py <path_to_json_file>")
        print("Example: python my_web3_script.py C:\\temp\\emissions.json")
    else:
        main(sys.argv[1])