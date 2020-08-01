import React from "react";
import "./utils";

var initialPort = "8889";

// this Controlled Component allows the user to input a connection URL
// see: https://reactjs.org/docs/forms.html
class ConnectURLForm extends React.Component 
{
	constructor(props) 
	{
		super(props);
		this.state = {
			ip: "",
			port: props.initialPort,
			useSecureProtocol: true,
			onUpdate: props.onUpdate,
		};
		this.handleChange = this.handleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleChange(event) 
	{
		console.log("Form change: ", event.target.id, event.target.value);
		
		if(event.target.id == "useSecureProtocol")
		{
			this.setState({useSecureProtocol: event.target.value});
		}
		if(event.target.id == "port")
		{
			this.setState({port: event.target.value});
		}
	}
	handleSubmit(event) 
	{
		console.log("Form submit");
		//alert('A name was submitted: ' + this.state.value);
		event.preventDefault();
		
		this.state.onUpdate(this.state.ip, this.state.port, this.state.useSecureProtocol);
	}

	render() 
	{
		return (
			<form onSubmit={this.handleSubmit}>
				<label>
					Port:&nbsp;<input type="text" id="port" value={this.state.port} onChange={this.handleChange} />
				</label>
			</form>
		);
		/*
		<label>
			Use WSS: <input type="checkbox" id="useSecureProtocol" value={this.state.useSecureProtocol} onChange={this.handleChange} />
		</label>
		*/
		//<input type="submit" value="Submit" />
	}
}

class WebSocketServer extends React.Component 
{
	constructor(props) 
	{
		super(props);
		
		this.state = {
			ip: props.initialIp ? props.initialIp : "localhost",
			port: props.initialPort ? props.initialPort : initialPort,
			useSecureProtocol: false,
			ws: null,
			connectionErrorMsg: null,
			allowAutoReconnect: true,
			//sendDataDelegate: props.sendDataDelegate,
			onReceiveData: props.onReceiveData,
		};
	}
	
	// CALLED BY PARENT COMPONENT
	sendData(data)
	{
		if (typeof data == "string")
		{
			if (!("TextEncoder" in window))
			{
				alert("Sorry, this browser does not support TextEncoder...");
				return;
			}
			
			// see: 
			// - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/Uint8Array
			// - https://stackoverflow.com/questions/6965107/converting-between-strings-and-arraybuffers
			// - https://developers.google.com/web/updates/2014/08/Easier-ArrayBuffer-String-conversion-with-the-Encoding-API
			
			// TextEncoder is always utf-8
			var ubytearr = new TextEncoder().encode(data);
			console.log("UTF-8 encoded data:", ubytearr);
			console.log("Length:", ubytearr.length);
			
			// allocate final buffer that includes 4 bytes for uint32 header value
			const buffer = new ArrayBuffer(4 + ubytearr.length);
			
			// copy length of data in bytes as a uint32
			const u32view = new Uint32Array(buffer, 0, 1);
			u32view[0] = ubytearr.length;
			
			// copy data into final buffer, offset by 4 bytes to account for data length header value
			const u8view = new Uint8Array(buffer, 4);
			u8view.set(ubytearr);
			
			// transmit final buffer
			console.log("Sending buffer:", buffer);
			this.state.ws.send(buffer);
		}
		else
		{
			console.warn("[Needs Implementation] Cannot send data of type ", typeof data);
		}
	}
	
	componentDidMount() 
	{	
		//this.state.sendDataDelegate.bind((data)=>{this.sendData(data)});
		
		this.resetTimeout();
		this.openConnection()
	}
	
	resetTimeout()
	{
		this.setState({ timeout: 250 });
	}
	
	attemptReconnect()
	{
		if(!this.state.allowAutoReconnect)
		{
			return;
		}
		
		//call check function after timeout
		var connectInterval = setTimeout(() => { this.checkConnection(); }, this.state.timeout)
		
		// double timeout every failure
		this.setState({ 
			connectInterval: connectInterval,
			timeout: Math.min(10000, 2*this.state.timeout)
		});
	}
	
	checkConnection()
	{
		//check if websocket instance is closed, if so call `connect` function
		
		if (!this.state.ws || this.state.ws.readyState == WebSocket.CLOSED)
		{
			this.setState({ 
				connectInterval: null,
				allowAutoReconnect: true, 
			});
			this.openConnection();
		}
	}

	openConnection()
	{
		var serverUrl = (this.state.useSecureProtocol?"wss":"ws") + "://" + this.state.ip + ":" + this.state.port;
		console.log("Opening connection to {0}!".format(serverUrl));
		
		var webSocket = new WebSocket(serverUrl, "binary");
				
		webSocket.onopen = (event) => {
			console.log("WebSocket open observed:", event);
			
			this.resetTimeout();
			clearTimeout(this.state.connectInterval);
			
			/*
			var protocolBanner = document.getElementById('ProtocolBanner')
			if(protocolBanner)
			{
				protocolBanner.parentNode.removeChild(protocolBanner);
			}
			*/
			
			this.setState({ 
				ws: webSocket,
				connectionErrorMsg: null,
			});
		};
		webSocket.onerror = (event) => {
			console.error("WebSocket error ('{0}'):".format(event.reason), event);
			
			// TODO: better error messaging
			this.setState({
				connectionErrorMsg: "Error with WebSocket ('{0}'). Reconnecting in {1}ms...".format(event.reason, this.state.timeout),
			});
			
			this.closeConnection();
		};
		webSocket.onclose = (event) => {
			console.warn("WebSocket closed ('{0}'):".format(event.reason), event);
			
			this.setState({	ws: null });
			this.attemptReconnect();
		};

		webSocket.onmessage = (event) => {
			console.log("WebSocket message:", typeof event.data, event.data);
			
			if (!("TextDecoder" in window))
			{
				alert("Sorry, this browser does not support TextDecoder...");
				return;
			}
			
			var enc = new TextDecoder("utf-8");
			//var arr = new Uint8Array([84,104,105,115,32,105,115,32,97,32,85,105,110,116, 56,65,114,114,97,121,32,99,111,110,118,101,114,116, 101,100,32,116,111,32,97,32,115,116,114,105,110,103]);
			
			//var blob = event.data;
			//blob.arrayBuffer().then(buffer => { console.log("Promise resolved!"); });
			//const buffer = await blob.arrayBuffer();
			
			//const buffer = new ArrayBuffer(event.data);
			
			var blob = event.data;
			new Response(blob).arrayBuffer().then(buffer => { 
				console.log("Promise resolved!"); 
			
				
				const u32view = new Uint32Array(buffer, 0, 1);
				console.log("Bytelength:", u32view[0]);
				
				const u8view = new Uint8Array(buffer, 4, u32view[0]);
				var decoded_str = enc.decode(u8view);
				console.log("Received from server: '", decoded_str, "'");
				
				this.state.onDataReceived(decoded_str);
			});
			
			console.log("Awaiting blob to resolve into byte array."); 
		}
	}
	
	closeConnection()
	{
		if(this.state.webSocket)
		{
			this.state.webSocket.close()
		}
	}
	
	renderConnectionStatus()
	{
		var urlForm = (<ConnectURLForm initialPort={this.state.port} onUpdate={(ip, port, useSecureProtocol)=>{
			var real_ip;
			if(!onlyWhitespace(ip))
			{
				// string is not empty and not just whitespace
				real_ip = ip;
			}
			else
			{
				real_ip = "localhost";
			}
			this.setState({ useSecureProtocol: useSecureProtocol, ip: real_ip, port: port });
		}} />);
		
		var reconnectButton = (<p><a href="#" onClick={()=>{ this.checkConnection();}}>Attempt reconnect now.</a></p>)
		
		var stopButton = (<p><a href="#" onClick={()=>{
			clearTimeout(this.state.connectInterval);
			this.setState({ allowAutoReconnect: false }); 
		}}>Prevent auto-reconnect.</a></p>)
		
		var errorMsg = null;
		if(this.state.connectionErrorMsg != null)
		{
			errorMsg = this.state.connectionErrorMsg;
		}
		// potentially add additional ways to set errorMsg here
		if(errorMsg != null)
		{
			errorMsg = (
				<div>
					<p className="error">{errorMsg}</p>
				</div>
			)
		}
		
		if(this.state.ws == null)
		{
			if(errorMsg == null)
			{
				return (
					<div>
						<p>Performing initial connection to telemetry server, please wait...</p>
						{urlForm}
						{reconnectButton}
						{stopButton}
					</div>
				);
			}
			/*
			else if(this.state.connectInterval == null)
			{
				return (
					<div>
						<p>Connection failed, re-attempting to connect...</p>
						{urlForm}
						{reconnectButton}
						{stopButton}
					</div>
				);
			}
			*/
			else if(!this.state.allowAutoReconnect)
			{
				return (
					<div>
						<p>No open connection.</p>
						{urlForm}
						{reconnectButton}
						{stopButton}
					</div>
				);
			}
		}
		
		if(errorMsg != null)
		{
			return (
				<div>
					{errorMsg}
					{urlForm}
					{reconnectButton}
					{stopButton}
				</div>
			);
		}
		
		return (
			<div>
				<p>App is connected to {this.state.ip}:{this.state.port}. 
				&nbsp; <a href="#" onClick={()=>{ this.closeConnection();}}>Disconnect.</a></p>
			</div>)
	}
	
	render() 
	{
		var renderedApp;
		if(this.state.ws)
		{
			renderedApp = (
			<div>
				<button onClick={()=>{
					this.sendData("Here's some text that the server is urgently awaiting!");
				}}>
					Ping Server
				</button>
			</div>)
		}
		else
		{
			renderedApp = (<div>App is rendering.</div>);
		}	
		return (
			<div>
				{renderedApp}
				{this.renderConnectionStatus()}
			</div>
		);
	}
}

export default WebSocketServer;
