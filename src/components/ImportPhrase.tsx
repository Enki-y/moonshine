import React, {useState, memo} from 'react';
import {
	StyleSheet,
	View,
	TextInput,
	Animated,
	TouchableOpacity,
	Easing,
	Text,
	FlatList
} from 'react-native';
import PropTypes from "prop-types";
import Camera from "./Camera";
import EvilIcon from "react-native-vector-icons/EvilIcons";
import XButton from "./XButton";
import Button from "./Button";
import ListItem from "./ListItem";
import DefaultModal from "./DefaultModal";
import {systemWeights} from "react-native-typography";

const {
	Constants: {
		colors
	}
} = require("../../ProjectData.json");
const bip39 = require("bip39");
const {
	getLastWordInString
} = require("../utils/helpers");

interface AvailableWordlists {
	[name: string] : {
		id: string,
		title: string
	}
}
const availableWordlists: AvailableWordlists = {
	chinese_simplified: {id: "chinese_simplified", title: "Chinese Simplified"},
	chinese_traditional: {id: "chinese_traditional", title: "Chinese Traditional"},
	english: {id: "english", title: "English"},
	french: {id: "french", title: "French"},
	italian: {id: "italian", title: "Italian"},
	japanese: {id: "japanese", title: "Japanese"},
	korean: {id: "korean", title: "Korean"},
	spanish: {id: "spanish", title: "Spanish"}
};

interface ImportPhraseComponent {
	createNewWallet: Function,
	onBack: Function
}
const _ImportPhrase = ({ createNewWallet = () => null, onBack = () => null }: ImportPhraseComponent) => {
	const [mnemonic, setMnemonic] = useState("");
	const [displayCamera, setDisplayCamera] = useState(false);
	const [cameraOpacity] = useState(new Animated.Value(0));
	const [suggestedWords, setSuggestedWords] = useState([]);
	const [selectedWordlist, setSelectedWordlist] = useState("english");
	const [displayAvailableWordlists, setDisplayAvailableWordlists] = useState(false);
	const wordlist = bip39.wordlists[selectedWordlist];

	const mnemonicIsValid = (mnemonic = ""): boolean => {
		try {
			//const regex = /^[a-z][a-z\s]*$/;
			const re = /^[ a-z ]+$/;
			return re.test(mnemonic);
		} catch (e) {return false;}
	};

	const updateMnemonic = (mnemonic = ""): void => {
		try {
			if (mnemonic === "") setMnemonic(mnemonic);
			mnemonic = mnemonic.toLowerCase();
			//Remove duplicate whitespaces/tabs/newlines
			mnemonic = mnemonic.replace(/\s\s+/g, " ");
			if (mnemonicIsValid(mnemonic)) {
				setMnemonic(mnemonic);
				updateSuggestedWords(mnemonic);
			}
		} catch (e) {}
	};
	
	const updateSuggestedWords = (mnemonic = ""): void => {
		try {
			const lastWord = getLastWordInString(mnemonic);
			if (!lastWord) {
				setSuggestedWords([]);
				return;
			}
			const _suggestedWords = wordlist.filter(word => word.substr(0, lastWord.length).includes(lastWord.toLowerCase()));
			setSuggestedWords(_suggestedWords);
		} catch (e) {}
	};

	//Handles The "Camera" View Opacity Animation
	const updateCamera = async ({ display = true, duration = 400 } = {}): Promise<{ error: boolean, data: object | string }> => {
		return new Promise(async (resolve) => {
			try {
				setDisplayCamera(display);
				Animated.timing(
					cameraOpacity,
					{
						toValue: display ? 1 : 0,
						duration,
						easing: Easing.inOut(Easing.ease),
						useNativeDriver: true
					}
				).start(async () => {
					//Perform any other action after the update has been completed.
					resolve({error: false, data: ""});
				});
			} catch (e) {
				console.log(e);
				resolve({ error: true, data: e });
			}
		});
	};

	const onBarCodeRead = async (data): Promise<void> => {
		try {
			if (bip39.validateMnemonic(data)) {
				updateMnemonic(data);
				updateCamera({display: false});
				createNewWallet({ mnemonic: data });
			} else {
				await updateCamera({display: false});
				alert(`Unable to parse the following data:\n${data}`);
			}
		} catch (e) {
			console.log(e);
		}
	};

	const _createNewWallet = (): void => {
		try {
			if (displayCamera) updateCamera({ display: false });
			if (mnemonic === "" || !bip39.validateMnemonic(mnemonic)) {
				alert("Invalid Mnemonic");
				return;
			}
			createNewWallet({ mnemonic });
		} catch (e) {
			console.log(e);
		}
	};
	
	const addWordToMnemonic = (word = ""): void => {
		const lastIndex = mnemonic.lastIndexOf(" ");
		let _mnemonic = mnemonic.substring(0, lastIndex);
		_mnemonic = `${_mnemonic} ${word} `;
		updateMnemonic(_mnemonic);
	};
	
	const updateSelectedWordlist = (wordlist = "english"): void => {
		updateMnemonic(""); //Clear text input of previous data.
		setSelectedWordlist(wordlist);
		setDisplayAvailableWordlists(false);
	};
	
	return (
		<View style={styles.container}>
			<View style={{ flex: 0.25 }}>
				<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
					<TouchableOpacity onPress={() => setDisplayAvailableWordlists(true)}>
						<Text style={[styles.title, { marginTop: 10 }]}>
							Selected Wordlist: {availableWordlists[selectedWordlist].title}
						</Text>
					</TouchableOpacity>
					<FlatList
						showsHorizontalScrollIndicator={false}
						keyboardShouldPersistTaps={"handled"}
						horizontal={true}
						data={suggestedWords}
						extraData={suggestedWords}
						keyExtractor={(word) => word}
						renderItem={({ item: word }): any => {
							try {
								return (
									<TouchableOpacity activeOpacity={0} style={styles.scrollView}>
										<TouchableOpacity onPress={() => addWordToMnemonic(word)} style={styles.button}>
											<Text key={word} style={{ color: colors.white, textAlign: "center" }}>{word}</Text>
										</TouchableOpacity>
									</TouchableOpacity>
								);
							} catch (e) {console.log(e);}
						}}
					/>
				</View>
			</View>
			<View style={{ flex: 1, alignItems: "center" }}>
				<TextInput
					placeholder="Please enter your mnemonic phrase here with each word seperated by a space... Ex: (project globe magnet)"
					style={styles.textInput}
					selectionColor={colors.lightPurple}
					autoCapitalize="none"
					autoCompleteType="off"
					autoCorrect={false}
					onChangeText={(mnemonic) => updateMnemonic(mnemonic)}
					value={mnemonic}
					multiline={true}
				/>
				<View style={styles.centerItem}>
					<TouchableOpacity onPress={() => updateCamera({ display: true })} style={styles.cameraIcon}>
						<EvilIcon style={{ bottom: -2 }} name={"camera"} size={40} color={colors.darkPurple} />
					</TouchableOpacity>
				</View>

				{bip39.validateMnemonic(mnemonic) &&
				<View style={styles.sendButton}>
					<Button title="Import Phrase" onPress={_createNewWallet} />
				</View>}
			</View>

			{displayCamera &&
				<Animated.View style={[styles.camera, { opacity: cameraOpacity, zIndex: 1000 }]}>
					<Camera onClose={() => updateCamera({ display: false })} onBarCodeRead={(data) => onBarCodeRead(data)} />
				</Animated.View>
			}

			{!displayCamera &&
			<Animated.View style={styles.xButton}>
				<XButton style={{ borderColor: "transparent" }} onPress={onBack} />
			</Animated.View>}
			
			
			<DefaultModal
				isVisible={displayAvailableWordlists}
				onClose={() => setDisplayAvailableWordlists(false)}
				contentStyle={styles.modalContent}
			>
				<FlatList
					data={Object.keys(availableWordlists)}
					extraData={availableWordlists}
					keyExtractor={(item) => availableWordlists[item].id}
					renderItem={({ item }) => (
						<ListItem
							item={item}
							onPress={() => updateSelectedWordlist(item)}
							title={availableWordlists[item].title}
							isSelected={selectedWordlist === availableWordlists[item].id}
						/>
					)}
					ItemSeparatorComponent={() => <View style={styles.separator} />}
				/>
				<View style={{ paddingVertical: "40%" }} />
			</DefaultModal>
		</View>
	);
};

_ImportPhrase.propTypes = {
	createNewWallet: PropTypes.func.isRequired,
	onBack: PropTypes.func.isRequired
};

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	title: {
		...systemWeights.semibold,
		color: colors.white,
		fontSize: 16,
		textAlign: "center"
	},
	textInput: {
		width: "80%",
		minHeight: 150,
		backgroundColor: colors.white,
		borderRadius: 10,
		padding: 10,
		textAlign: "left",
		alignItems: "center",
		justifyContent: "center",
		color: colors.purple,
		fontWeight: "bold"
	},
	camera: {
		flex: 1,
		zIndex: 500
	},
	centerItem: {
		zIndex: 10,
		alignItems:"center",
		justifyContent:"center",
		marginTop: 10
	},
	cameraIcon: {
		alignItems:"center",
		justifyContent:"center",
		width: 64,
		height: 64,
		backgroundColor: colors.white,
		borderRadius: 100
	},
	sendButton: {
		alignItems: "center",
		justifyContent: "center",
		marginTop: 50
	},
	xButton: {
		position: "absolute",
		alignItems: "center",
		left: 0,
		right: 0,
		bottom: 10
	},
	modalContent: {
		borderWidth: 5,
		borderRadius: 20,
		borderColor: colors.lightGray
	},
	separator: {
		width: "100%",
		height: 2,
		backgroundColor: colors.gray,
		marginVertical: 10
	},
	button: {
		borderWidth: 1,
		borderRadius: 18,
		borderColor: colors.white,
		backgroundColor: "transparent",
		paddingVertical: 10,
		paddingHorizontal: 15,
		marginHorizontal: 5
	},
	scrollView: {
		alignSelf: "center",
		alignItems: "center",
		justifyContent: "center",
		height: "100%"
	}
});

//ComponentShouldNotUpdate
const ImportPhrase = memo(
	_ImportPhrase,
	(prevProps, nextProps) => {
		if (!prevProps || !nextProps) return true;
		return prevProps === nextProps;
	}
);
export default ImportPhrase;
