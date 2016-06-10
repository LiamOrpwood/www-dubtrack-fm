Dubtrack.Events = {};

_.extend(Dubtrack.Events, Backbone.Events);

Dubtrack.realtime = {
	channel: null,

	dtPubNub: null,

	init : function(){
		var uuid = null;

		if(Dubtrack.loggedIn){
			uuid = Dubtrack.session.get("_id");
		}else{
			uuid = PUBNUB.uuid();
		}

		Dubtrack.realtime.dtPubNub = PUBNUB.init({
			backfill : false,
			'publish_key': '',
			'subscribe_key': Dubtrack.config.keys.pubunub,
			'ssl': true,
			'uuid': uuid
		});

		return this;
	},

	destroy: function(){
		if(Dubtrack.realtime.channel === null) return;

		Dubtrack.realtime.dtPubNub.unsubscribe({
			channel : Dubtrack.realtime.channel
		});

		Dubtrack.realtime.channel = null;
		Dubtrack.realtime.dtPubNub = null;
	},

	channelPresence: function(callback){
		if(Dubtrack.realtime.channel === null) return;

		if( Dubtrack.realtime.dtPubNub === null){
			Dubtrack.realtime.init();
		}

		Dubtrack.realtime.dtPubNub.here_now({
			channel : Dubtrack.realtime.channel,
			callback : callback
		});

	},

	subscribe: function(channel, callback, forceGuest){
		//create instance or disconnect from previous channel
		if( Dubtrack.realtime.dtPubNub === null){
			Dubtrack.realtime.init();
		}
		else{
			Dubtrack.realtime.destroy();
		}

		if(channel === undefined || channel === null || channel === "") throw new Error("Cannot connect to empty channel");

		Dubtrack.realtime.channel = channel;

		if(Dubtrack.loggedIn){
			channel = Dubtrack.realtime.channel + ',dubtrackuser-' + Dubtrack.session.get('_id');
		}

		Dubtrack.realtime.dtPubNub.subscribe({
			channel: channel,

			callback: function(r){
				//console.log("DUBTRACK real time respose ", r);
				Dubtrack.realtime.callback(r);
			},

			presence: function(r){
				r.type = 'pubnub-' + (r.type ? r.type : 'presence');
				//console.log("DUBTRACK presence real time respose ", r);

				Dubtrack.realtime.callback(r);
			},

			disconnect: function(){
			},

			reconnect: function(){
			},

			connect: function(){
				if(callback) callback();
				//console.log('DUBTRACK connected to real channel ' + Dubtrack.realtime.channel);
			},

			error: function(e) {
				// Do not call subscribe() here!
				// PUBNUB will auto-reconnect.
				console.log("DUBTRACK RT error ", e);
			}
		});
	},

	callback: function(r){
		if(r.type) Dubtrack.Events.trigger('realtime:' + r.type, r);
	}
};
